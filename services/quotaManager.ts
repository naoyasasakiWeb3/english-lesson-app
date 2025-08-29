import { wordsApiService } from './wordsApiService';
import { databaseService } from './database';

export interface QuotaStatus {
  canMakeRequest: boolean;
  warningLevel: 'safe' | 'warning' | 'critical' | 'exceeded';
  usagePercentage: number;
  remainingRequests: number;
  quotaResetTime: Date;
  message?: string;
}

export interface BatchRequestResult<T> {
  successful: T[];
  failed: Array<{ item: any; error: string }>;
  skipped: number;
  quotaExceeded: boolean;
  finalQuotaStatus: QuotaStatus;
}

export class QuotaManager {
  private readonly DEFAULT_DAILY_QUOTA = 2500;
  
  async getQuotaStatus(dailyQuota: number = this.DEFAULT_DAILY_QUOTA): Promise<QuotaStatus> {
    const canMake = await wordsApiService.canMakeRequest(dailyQuota);
    const warning = await wordsApiService.shouldWarnUser(dailyQuota);
    const stats = await wordsApiService.getUsageStats(dailyQuota);
    const resetTime = await wordsApiService.getQuotaResetTime();
    
    return {
      canMakeRequest: canMake,
      warningLevel: warning.warningLevel,
      usagePercentage: stats.usagePercentage,
      remainingRequests: warning.requestsRemaining,
      quotaResetTime: resetTime,
      message: warning.message,
    };
  }

  async checkQuotaBeforeRequest(dailyQuota: number = this.DEFAULT_DAILY_QUOTA): Promise<{
    allowed: boolean;
    reason?: string;
    warningMessage?: string;
  }> {
    const status = await this.getQuotaStatus(dailyQuota);
    
    if (!status.canMakeRequest) {
      const hoursUntilReset = Math.ceil((status.quotaResetTime.getTime() - Date.now()) / (1000 * 60 * 60));
      return {
        allowed: false,
        reason: `Quota buffer exceeded. ${status.remainingRequests} requests remaining. Resets in ${hoursUntilReset}h.`,
      };
    }
    
    const warningMessage = status.warningLevel !== 'safe' ? status.message : undefined;
    return {
      allowed: true,
      warningMessage,
    };
  }

  async executeWithQuotaTracking<T>(
    operation: () => Promise<T>,
    options?: {
      respectQuota?: boolean;
      recordUsage?: boolean;
      provider?: string;
    }
  ): Promise<T> {
    const { respectQuota = true, recordUsage = true, provider = 'wordsapi' } = options || {};
    
    if (respectQuota) {
      const quotaCheck = await this.checkQuotaBeforeRequest();
      if (!quotaCheck.allowed) {
        throw new Error(quotaCheck.reason || 'Quota limit reached');
      }
      
      if (quotaCheck.warningMessage) {
        console.warn('Quota Warning:', quotaCheck.warningMessage);
      }
    }
    
    let success = false;
    let result: T;
    
    try {
      result = await operation();
      success = true;
      return result;
    } catch (error) {
      if (recordUsage) {
        // Record failed usage for monitoring
        await databaseService.recordApiUsage(provider, false);
      }
      throw error;
    } finally {
      if (recordUsage && success) {
        await databaseService.recordApiUsage(provider, true);
      }
    }
  }

  async executeBatchWithQuotaManagement<TInput, TOutput>(
    items: TInput[],
    processor: (item: TInput) => Promise<TOutput>,
    options?: {
      respectQuota?: boolean;
      maxConcurrent?: number;
      stopOnQuotaExceeded?: boolean;
      dailyQuota?: number;
    }
  ): Promise<BatchRequestResult<TOutput>> {
    const {
      respectQuota = true,
      maxConcurrent = 3,
      stopOnQuotaExceeded = true,
      dailyQuota = this.DEFAULT_DAILY_QUOTA,
    } = options || {};
    
    const result: BatchRequestResult<TOutput> = {
      successful: [],
      failed: [],
      skipped: 0,
      quotaExceeded: false,
      finalQuotaStatus: await this.getQuotaStatus(dailyQuota),
    };
    
    // Pre-check quota for batch operation
    if (respectQuota) {
      const estimate = await wordsApiService.estimateRequestsForBatch(items.length);
      if (!estimate.canProcessAll) {
        console.warn(`Batch processing: Can only process ${estimate.maxProcessable}/${items.length} items`);
        if (stopOnQuotaExceeded && estimate.maxProcessable === 0) {
          result.skipped = items.length;
          result.quotaExceeded = true;
          return result;
        }
      }
    }
    
    // Process items in controlled batches
    const batchSize = Math.min(maxConcurrent, 3); // Limit concurrent requests
    for (let i = 0; i < items.length; i += batchSize) {
      // Check quota before each batch
      if (respectQuota && !(await wordsApiService.canMakeRequest(dailyQuota))) {
        const remainingItems = items.length - i;
        result.skipped += remainingItems;
        result.quotaExceeded = true;
        
        if (stopOnQuotaExceeded) {
          console.warn(`Quota exceeded. ${remainingItems} items skipped.`);
          break;
        }
      }
      
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(async (item, index) => {
        const globalIndex = i + index;
        
        try {
          const output = await this.executeWithQuotaTracking(
            () => processor(item),
            { respectQuota, recordUsage: true }
          );
          result.successful.push(output);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.failed.push({ item, error: errorMessage });
          
          if (errorMessage.includes('quota') || errorMessage.includes('Quota')) {
            result.quotaExceeded = true;
            if (stopOnQuotaExceeded) {
              // Cancel remaining items in this batch and skip rest
              const remainingInBatch = batch.length - (index + 1);
              const remainingTotal = items.length - globalIndex - 1;
              result.skipped += remainingInBatch + (remainingTotal - remainingInBatch);
              throw new Error('QUOTA_EXCEEDED'); // Signal to break outer loop
            }
          }
        }
        
        // Rate limiting delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      });
      
      try {
        await Promise.all(batchPromises);
      } catch (error) {
        if (error.message === 'QUOTA_EXCEEDED') {
          break;
        }
      }
    }
    
    result.finalQuotaStatus = await this.getQuotaStatus(dailyQuota);
    return result;
  }

  async getUsageReport(dailyQuota: number = this.DEFAULT_DAILY_QUOTA): Promise<{
    today: any;
    warnings: string[];
    recommendations: string[];
    resetTime: Date;
  }> {
    const stats = await wordsApiService.getUsageStats(dailyQuota);
    const warning = await wordsApiService.shouldWarnUser(dailyQuota);
    const resetTime = await wordsApiService.getQuotaResetTime();
    
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    if (warning.shouldWarn) {
      warnings.push(warning.message);
    }
    
    if (stats.warningLevel === 'critical') {
      recommendations.push('Consider reducing API-dependent searches until quota resets');
      recommendations.push('Use cached results when possible');
      recommendations.push('Focus on reviewing existing vocabulary');
    } else if (stats.warningLevel === 'warning') {
      recommendations.push('Monitor your search frequency');
      recommendations.push('Cache results are being used efficiently');
    }
    
    if (stats.usagePercentage === 0) {
      recommendations.push('WordsAPI is available for expanding your vocabulary');
    }
    
    return {
      today: stats,
      warnings,
      recommendations,
      resetTime,
    };
  }
}

// Export singleton instance
export const quotaManager = new QuotaManager();