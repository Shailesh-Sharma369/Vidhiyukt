export type DocumentType =
  | 'Privacy Policy'
  | 'DPA'
  | 'Terms of Service'
  | 'Cookie Notice'
  | 'Data Retention Policy'
  | 'Vendor Agreement';

export type JurisdictionType = 'GDPR' | 'DPDP' | 'CCPA';

export type IntakeQuestionType = 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'multiselect';

export type IntakeAnswerValue = string | string[] | boolean | number | null;

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface QuestionValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  minSelected?: number;
  maxSelected?: number;
  pattern?: string;
  message?: string;
}

export interface ConditionalCondition {
  questionId: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'exists' | 'notExists';
  value?: IntakeAnswerValue;
}

export interface ConditionalRule {
  id: string;
  conditions: ConditionalCondition[];
  logic?: 'all' | 'any';
  action: 'show' | 'hide';
  targetQuestionIds: string[];
}

interface QuestionBase {
  id: string;
  sectionId: string;
  order: number;
  label: string;
  description?: string;
  placeholder?: string;
  validation?: QuestionValidation;
  conditionalRules?: ConditionalRule[];
}

export interface TextQuestion extends QuestionBase {
  type: 'text' | 'textarea';
  defaultValue?: string;
}

export interface ChoiceQuestion extends QuestionBase {
  type: 'select' | 'radio';
  options: readonly QuestionOption[];
  defaultValue?: string;
}

export interface CheckboxQuestion extends QuestionBase {
  type: 'checkbox';
  defaultValue?: boolean;
}

export interface MultiSelectQuestion extends QuestionBase {
  type: 'multiselect';
  options: readonly QuestionOption[];
  defaultValue?: string[];
}

export type Question = TextQuestion | ChoiceQuestion | CheckboxQuestion | MultiSelectQuestion;

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  questionIds: string[];
}

export interface IntakeSchema {
  id: string;
  documentType: DocumentType;
  title: string;
  description: string;
  version: string;
  supportedJurisdictions: readonly JurisdictionType[];
  sections: readonly FormSection[];
  questions: readonly Question[];
}

export interface UserAnswer {
  questionId: string;
  value: IntakeAnswerValue;
  updatedAt?: string;
}

export type IntakeAnswerMap = Readonly<Record<string, IntakeAnswerValue>>;