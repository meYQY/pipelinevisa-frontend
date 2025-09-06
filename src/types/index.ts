// 案例状态枚举 - 与后端完全一致
export enum CaseStatus {
  CREATED = 'created',
  LINK_SENT = 'link_sent',
  CLIENT_FILLING = 'client_filling',
  CLIENT_SUBMITTED = 'client_submitted',
  AI_REVIEWING = 'ai_reviewing',
  CONSULTANT_REVIEWING = 'consultant_reviewing',
  NEED_SUPPLEMENT = 'need_supplement',
  MATERIALS_APPROVED = 'materials_approved',
  AI_PROCESSING = 'ai_processing',
  CONSULTANT_FINAL_REVIEW = 'consultant_final_review',
  CONSULTANT_FINAL_APPROVED = 'consultant_final_approved',
  SENT_TO_CLIENT = 'sent_to_client',
  CLIENT_CONFIRMED = 'client_confirmed',
  COMPLETED = 'completed',
}

// 签证类型
export enum VisaType {
  B1_B2 = 'B1/B2',
  F1 = 'F1',
  H1B = 'H1B',
  L1 = 'L1',
  O1 = 'O1',
}

// 用户角色
export enum UserRole {
  ADMIN = 'admin',
  CONSULTANT = 'consultant',
  CLIENT = 'client',
}

// 用户类型
export interface User {
  id: string
  username: string
  email: string
  full_name: string
  role: UserRole
  organization_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// 案例类型
export interface Case {
  id: string
  case_number: string
  organization_id: string
  consultant_id: string
  visa_type: VisaType
  status: CaseStatus
  review_round: number
  created_at: string
  updated_at: string
  // 关联数据
  applicant?: Applicant
  consultant?: User
  link?: CaseLink
  diagnoses?: Diagnosis[]
}

// 申请人信息
export interface Applicant {
  id: string
  case_id: string
  name: string
  name_pinyin?: string
  email?: string
  phone?: string
  passport_number?: string
  created_at: string
  updated_at: string
}

// 案例链接
export interface CaseLink {
  id: string
  case_id: string
  token: string
  expires_at: string
  is_used: boolean
  created_at: string
}

// 诊断报告
export interface Diagnosis {
  id: string
  case_id: string
  review_round: number
  total_issues: number
  critical_issues: number
  major_issues: number
  minor_issues: number
  status: 'pending' | 'completed'
  created_at: string
  issues: DiagnosisIssue[]
}

// 诊断问题
export interface DiagnosisIssue {
  id: string
  field_path: string
  issue_type: 'missing' | 'inconsistent' | 'invalid' | 'suggestion'
  severity: 'blocker' | 'critical' | 'warning' | 'info'
  description: string
  suggestion?: string
  is_resolved: boolean
}

// DS-160表单数据结构 - 完全按照后端API对齐
export interface DS160FormData {
  // 第1部分：个人信息1 - 官方DS-160字段
  personal_info_1: {
    surname?: string                    // 姓氏
    given_names?: string                // 名字（复数）
    full_name_native?: string           // 母语全名
    full_name_native_na?: boolean       // 不适用标记
    has_used_other_names?: boolean      // 是否使用过其他姓名
    other_surnames?: string             // 曾用姓氏
    other_given_names?: string          // 曾用名字
    has_telecode?: boolean              // 有电码
    telecode_surname?: string           // 电码姓氏
    telecode_given_names?: string       // 电码名字
    sex?: 'MALE' | 'FEMALE'            // 性别（官方枚举）
    marital_status?: 'SINGLE' | 'MARRIED' | 'LEGALLY_SEPARATED' | 'DIVORCED' | 'WIDOWED'
    date_of_birth?: string              // 出生日期
    city_of_birth?: string              // 出生城市
    state_province_of_birth?: string    // 出生省份
    state_province_of_birth_na?: boolean // 不适用标记
    country_of_birth?: string           // 出生国家
  }

  // 第2部分：个人信息2 - 官方DS-160字段
  personal_info_2: {
    nationality?: string                // 国籍
    has_other_nationality?: boolean     // 有其他国籍
    other_nationality?: string          // 其他国籍（单个）
    has_other_passport?: boolean        // 有其他护照
    other_passport_number?: string      // 其他护照号
    is_permanent_resident_other_country?: boolean // 是其他国家永久居民
    permanent_resident_country?: string // 永久居民国家
    national_id_number?: string         // 国家ID号码
    national_id_na?: boolean            // 不适用标记
    us_social_security_number?: string  // 美国社会保险号
    us_social_security_na?: boolean     // 不适用标记
    us_taxpayer_id?: string             // 美国纳税人ID
    us_taxpayer_id_na?: boolean         // 不适用标记
  }

  // 第3部分：地址和电话 - 官方DS-160字段
  address_phone: {
    home_address?: string               // 家庭地址
    mailing_same_as_home?: boolean      // 邮寄地址同家庭地址
    mailing_address?: string            // 邮寄地址
    primary_phone?: string              // 主要电话
    secondary_phone?: string            // 次要电话
    secondary_phone_na?: boolean        // 不适用标记
    work_phone?: string                 // 工作电话
    work_phone_na?: boolean             // 不适用标记
    email?: string                      // 电子邮件
    social_media_accounts?: Array<{     // 社交媒体账户
      platform: string
      username: string
    }>
  }

  // 第4部分：护照信息 - 官方DS-160字段
  passport: {
    passport_type?: string                  // 护照类型
    passport_type_explain?: string          // 护照类型说明
    passport_number?: string                // 护照号码
    passport_book_number?: string           // 护照本编号
    passport_book_number_na?: boolean       // 不适用标记
    passport_country_authority?: string     // 护照颁发国家/权威
    passport_issued_city?: string           // 护照颁发城市
    passport_issued_state?: string          // 护照颁发州/省
    passport_issued_state_na?: boolean      // 不适用标记
    passport_issued_country?: string        // 护照颁发国家
    passport_issue_date?: string            // 护照颁发日期
    passport_expiry_date?: string           // 护照到期日期
    passport_no_expiration?: boolean        // 护照无到期日
    has_lost_passport?: boolean             // 护照丢失
    lost_passport_details?: string          // 丢失护照详情
  }

  // 第5部分：旅行信息 (11个字段)
  travel: {
    purpose_of_trip?: string
    specific_purpose?: string
    other_purpose_explanation?: string
    intended_date_of_arrival?: string
    intended_length_of_stay?: string
    intended_length_of_stay_period?: string
    intended_date_of_departure?: string
    flight_number?: string
    city_of_port_of_entry?: string
    state_of_port_of_entry?: string
    address_in_us_street_1?: string
    address_in_us_street_2?: string
    address_in_us_city?: string
    address_in_us_state?: string
    address_in_us_postal_code?: string
    person_paying_trip?: string
    relationship_to_applicant?: string
  }

  // 第6部分：旅行同伴 (8个字段)
  travel_companions: {
    traveling_with_others?: boolean
    traveling_as_group?: boolean
    group_name?: string
    number_of_people?: number
    companion_1_surname?: string
    companion_1_given_name?: string
    companion_1_relationship?: string
    companion_2_surname?: string
    companion_2_given_name?: string
    companion_2_relationship?: string
    companion_3_surname?: string
    companion_3_given_name?: string
    companion_3_relationship?: string
  }

  // 第7部分：以前的美国旅行 (10个字段)
  previous_us_travel: {
    been_to_us_before?: boolean
    previous_visit_1_date?: string
    previous_visit_1_length_of_stay?: string
    previous_visit_1_length_of_stay_period?: string
    previous_visit_2_date?: string
    previous_visit_2_length_of_stay?: string
    previous_visit_2_length_of_stay_period?: string
    previous_visit_3_date?: string
    previous_visit_3_length_of_stay?: string
    previous_visit_3_length_of_stay_period?: string
    previous_visit_4_date?: string
    previous_visit_4_length_of_stay?: string
    previous_visit_4_length_of_stay_period?: string
    previous_visit_5_date?: string
    previous_visit_5_length_of_stay?: string
    previous_visit_5_length_of_stay_period?: string
    us_drivers_license?: boolean
    us_drivers_license_number?: string
    us_drivers_license_state?: string
    previous_visa_issued?: boolean
    previous_visa_number?: string
    previous_visa_year?: string
    visa_waiver_program?: boolean
  }

  // 第8部分：美国联系人 (8个字段)
  us_contact: {
    contact_person_surname?: string
    contact_person_given_name?: string
    contact_organization_name?: string
    contact_relationship_to_applicant?: string
    contact_address_street_1?: string
    contact_address_street_2?: string
    contact_address_city?: string
    contact_address_state?: string
    contact_address_postal_code?: string
    contact_phone_number?: string
    contact_email_address?: string
  }

  // 第9部分：家庭信息 (12个字段)
  family: {
    father_surname?: string
    father_given_name?: string
    father_date_of_birth?: string
    father_in_us?: boolean
    mother_surname?: string
    mother_given_name?: string
    mother_date_of_birth?: string
    mother_in_us?: boolean
    immediate_relative_surname?: string
    immediate_relative_given_name?: string
    immediate_relative_relationship?: string
    immediate_relative_status?: string
  }

  // 第10部分：工作/教育/培训 (15个字段)
  work_education: {
    primary_occupation?: string
    present_employer_school_name?: string
    present_employer_school_address_street_1?: string
    present_employer_school_address_street_2?: string
    present_employer_school_address_city?: string
    present_employer_school_address_state_province?: string
    present_employer_school_address_postal_code?: string
    present_employer_school_address_country?: string
    present_employer_school_phone_number?: string
    present_employer_school_course_of_study?: string
    present_employer_school_monthly_income?: string
    present_employer_school_monthly_income_currency?: string
    present_employer_school_start_date?: string
    present_employer_school_end_date?: string
    describe_duties?: string
  }
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}