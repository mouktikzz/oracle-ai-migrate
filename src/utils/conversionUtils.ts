import { ConversionResult, CodeFile, ConversionIssue, DataTypeMapping } from '@/types';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from 'uuid';
import { getCachedConversion, setCachedConversion } from '@/utils/conversionUtils';
import { supabase } from '../integrations/supabase/client';

let cacheEnabled = true;

export function isCacheEnabled() {
  return cacheEnabled;
}

export function setCacheEnabled(enabled: boolean) {
  cacheEnabled = enabled;
}

export * from '@/utils/componentUtilswithlangchain';
