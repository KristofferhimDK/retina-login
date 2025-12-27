
export interface AISecurityReport {
  status: 'AUTHORIZED' | 'DENIED' | 'PENDING';
  message: string;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  biometricMatch: number;
}

export enum LoginState {
  IDLE = 'IDLE',
  ENROLLING = 'ENROLLING',
  SCANNING = 'SCANNING',
  VERIFYING = 'VERIFYING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface EnrollmentData {
  frontal: string;
  left: string;
  right: string;
}
