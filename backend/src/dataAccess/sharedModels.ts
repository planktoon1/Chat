export interface BaseGetInput {
  limit?: number;
  /** Inclusive. Date as a string value in ISO format. Default: omitted */
  after?: string;
  /** Exclusive. Date as a string value in ISO format. Default: current datetime */
  before?: string;
  lastEvaluated?: any;
}
