import { gql } from "apollo-server-express";

export default gql`
  scalar Date

  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }

  type Query {
    #ADMIN
    admin_login(email: String!, password: String!): AdminExaminerAuth

    admin_profile: AdminExaminerAuth

    get_one_assessment_group(
      group_id: String
      title: String
      group_url: String
    ): GroupResponse

    get_all_assessment_groups(
      cursor: String
      limit: Int
    ): AssessmentGroupConnection

    admin_assessment_groups: GroupResponse

    get_student_groups(student_id: String): GroupResponse

    #ASSESSMENTS
    get_all_assessments(cursor: String!, limit: Int): AssessmentConnection!

    get_assessment(assessment_url: String!): AssessmentResponse

    assessment_feed(group_url: String!): AssessmentResponse

    get_admin_assessments: AssessmentResponse

    #STUDENTS

    student_profile(student_id: String): StudentAuth!

    get_all_students(cursor: String, limit: Int): StudentConnection

    eligible_assessments(
      #student_id: String
      group_id: String
    ): AssessmentResponse

    attempted_assessments: AssessmentResponse

    asessment_session_page(
      student_id: String
      assessment_id: String
    ): AssessmentSession

    #EXAMINER
    examiner_login(email: String!, password: String): Status
    view_invited_examiners: Admininstrators

    #QUESTIONS
    all_assessment_questions(
      assessment_id: String
      assessment_url: String
    ): QuestionsResponse

    get_assessment_question(question_id: String): QuestionsResponse

    view_examiner_profile(examiner_id: String): Examiner
    #SESSION
  }

  # BEGIN MUTATIONS
  type Mutation {
    authGoogle(input: AuthInput!): Status

    admin_google_login(googleToken: String): Status

    google_social_login(input: SocialAuthInput!): AdminExaminerAuth

    create_admin(
      full_name: String!
      email: String!
      phone_number: String
      password: String!
    ): AdminExaminerAuth

    admin_verification(verification_link: String): Status

    admin_profile_update(
      full_name: String
      phone_number: String
      profile_avatar: String
      contact_address: String
      is_individual: Boolean
      is_organization: Boolean
      user_description: String
      organization_name: String
      organization_description: String
      # TODO Consider removing password update from profile page
      new_password: String
      old_password: String
    ): AdminExaminerAuth

    admin_forgot_password_request(email: String): Status

    admin_reset_password_request(
      reset_link: String
      new_password: String
      confirm_password: String
    ): AdminExaminerAuth

    #GROUPS
    create_assessment_group(
      title: String!
      description: String!
      icon_avatar: String
    ): GroupResponse

    delete_assessment_group(group_id: String!): Status

    enroll_single_student(group_id: String!, student_id: String!): Status

    #EXAMINERS
    add_examiner_manually(
      full_name: String
      email: String
      phone_number: String
      assessment_id: String
    ): Status

    invite_examiner(email: String!, assessment_url: String!): Status

    email_assign_multiple_examiner(
      assessment_id: String
      examiners_contacts: [String]
    ): BatchStatus
    validate_examiner_email(validation_link: String): Status

    update_examiner_profile(
      full_name: String
      profile_image: String
      phone_number: String
      password: String
    ): Status

    assign_examiner(assessment_url: String, examiner_id: String): Status

    delete_examiner(examiner_id: String): Status

    #STUDENTS
    student_login(email: String, password: String): StudentAuth

    add_student_manually(
      full_name: String!
      email: String!
      phone_number: String
      group_id: String
    ): Status!

    email_enroll_multiple_students(
      group_id: String
      student_contacts: [String]
    ): BatchStatus
    csv_enroll_multiple_students(
      group_id: String
      student_contacts_csv: [Student_CSV_Batch]
    ): BatchStatus

    delete_student(student_id: String): Status

    student_profile_update(
      full_name: String
      phone_number: String
      profile_avatar: String
      contact_address: String
      # TODO Consider removing password update from profile page
      new_password: String
      old_password: String
    ): StudentAuth

    student_password_update(
      old_password: String!
      new_password: String!
      confirm_new_password: String!
    ): StudentAuth

    student_forgot_password_request(email: String): Status

    student_reset_password_request(
      reset_link: String
      new_password: String
      confirm_password: String
    ): StudentAuth

    #ASSESSMENTS
    create_assessment(
      title: String!
      instruction: String!
      duration_minutes: Int!
      option_student_review_assessment: Boolean
      option_instant_result: Boolean
      option_retake_test: Boolean
      passing_percentage: Int
      questioning_format: String
      group_id: String!
      assigned_examiners: [String]
    ): AssessmentResponse

    publish_toggle_assessment(
      assessment_id: String
      is_published: Boolean
    ): Status

    delete_assessment(assessment_id: String): Status

    #QUESTIONS
    add_assessment_question(
      assessment_id: String!
      #assessment_url: String!
      question_statement: String!
      #question_type: String!
      question_diagram_url: String
      answer_options: [QuestionOptionInput]
    ): QuestionResponse

    add_essay_question(
      assessment_id: String
      question_statement: String
      question_diagram_url: String
      answer_essay: String
    ): QuestionResponse

    delete_assessment_question(question_id: String): Status

    edit_assessment_question(
      question_id: String
      question_statement: String!
      question_type: String!
      question_diagram_url: String
      answer_options: [QuestionOptionInput]
    ): Status

    #ASSESSMENT_SESSION
    submit_assessment_test(input: SubmitAssessmentTest): TestSessionResponse

    #GROUP_RESULT
    compose_group_result(
      group_id: String
      continuous_assessments: [ContinuousAssessmentsInput]
    ): GroupResult
  }

  #END MUTATIONS

  #SUBSCRIPTIONS
  type Subscription {
    session_countdown: String
  }

  #SUBSCRIPTION TYPE
  type TimeLeft {
    time_left: String
  }
  #ADMIN TYPES
  interface User {
    _id: ID
    full_name: String
    email: String
  }

  #TO BE DELETED
  type UserAuth {
    admin: Admin
    examiner: Examiner
    student: Student
    token: String
  }

  type AdminExaminerAuth {
    admin: Admin
    examiner: Examiner
    token: String
  }
  type StudentAuth {
    student: Student
    token: String
  }

  type AuthResponse {
    token: String
    full_name: String
    first_name: String
    last_name: String
    email: String
    profile_picture: String
    auth_type: GoogleAuthType
  }

  input AuthInput {
    accessToken: String!
    auth_type: GoogleAuthType
  }

  input SocialAuthInput {
    profile_object: GoogleProfile
    auth_type: String
  }

  input GoogleProfile {
    googleId: String
    imageUrl: String
    email: String
    name: String
    givenName: String
    familyName: String
  }

  type Status {
    message: String
    value: Boolean
    next: String
    action: String
    user: User
    token: String
    #Pending Removal
  }
  type BatchStatus {
    message: String
    batch_status: BatchFields
  }
  type BatchFields {
    new_registrations: [String]
    # For Students
    new_enrollments: [String]
    failed_enrollments: [String]
    # For Examiners
    new_assignments: [String]
    failed_assignments: [String]
  }

  type Admininstrators {
    admininstrators: [Admin]
    examiners: [Examiner]
  }
  #ADMINISTRATOR TYPE

  type GroupResponse {
    group: AssessmentGroup
    groups: [AssessmentGroup]
  }

  type AssessmentResponse {
    assessment: Assessment
    assessments: [Assessment]
    count: Int
  }

  type QuestionResponse {
    question: AssessmentQuestion
    questions: [AssessmentQuestion]
    count: Int
  }

  type Admin {
    _id: ID!
    full_name: String!
    email: String!
    phone_number: String
    contact_address: String
    profile_avatar: String
    provider_url: String
    email_verified_status: Boolean
    #Profile data draft
    is_individual: Boolean
    is_organization: Boolean
    user_description: String
    organization_name: String
    organization_description: String
    #
    createdAt: Date
    updatedAt: Date
  }
  # EXAMINER
  type Examiner {
    _id: ID!
    full_name: String
    profile_image: String
    phone_number: String
    email: String!
    email_verified_status: Boolean
  }

  #GROUPS
  type AssessmentGroup {
    _id: ID!
    title: String!
    description: String!
    icon_avatar: String
    group_url: String
    created_by: Admin!
    createdAt: Date
    enrolled_students: [Student!]
  }

  type AssessmentGroupConnection {
    edges: [AssessmentGroup]
    page_info: PageInfo
  }

  type Assessment {
    _id: ID!
    title: String
    instruction: String
    duration_minutes: Int
    option_student_review_assessment: Boolean
    #REMOVE
    option_view_result: Boolean
    option_retake_test: Boolean
    option_instant_result: Boolean
    passing_percentage: Int
    questioning_format: String
    assessment_url: String
    is_published: Boolean
    group_id: AssessmentGroup!
    assigned_examiners: [Examiner!]
    createdAt: Date
  }

  type AssessmentConnection {
    edges: [Assessment!]!
    page_info: PageInfo!
  }

  #QUESTIONS AND TESTS
  type AssessmentQuestion {
    _id: ID!
    question_statement: String!
    #question_type: String!
    question_diagram_url: String
    answer_options: [AssessmentQuestionOption!]!
    assessment_id: String!
    createdAt: Date
  }

  input QuestionOptionInput {
    #_id: ID!
    option_statement: String!
    is_correct: Boolean!
    correct_answer_explanation: String
  }

  input ContinuousAssessmentsInput {
    assessment_id: String
    assessment_percentage: Int
  }

  type GroupResult {
    group: AssessmentGroup
    #TOBE REMOVED (assessments)
    assessments: [Assessment]
    assessment_values: [SingleGroupResult]
    mark_count: Int
  }

  type SingleGroupResult {
    assessment: Assessment
    assessment_percentile: Int
  }

  type AssessmentQuestionOption {
    _id: ID!
    option_statement: String!
    is_correct: Boolean!
    correct_answer_explanation: String
  }

  type QuestionsResponse {
    question: AssessmentQuestion
    questions: [AssessmentQuestion]
    count: Int
  }

  type PageInfo {
    has_next_page: Boolean!
    end_cursor: Date!
  }

  type Student implements User {
    _id: ID!
    full_name: String!
    email: String!
    email_verified_status: Boolean
    phone_number: String
    contact_address: String
    profile_avatar: String
    invited_by: String
  }

  type StudentConnection {
    edges: [Student]
    page_info: PageInfo
  }

  type StudentAssessmentSession {
    _id: ID
    taken_on: Date
    pass_fail: Boolean
    retake_count: Int
    assessment_id: String
    student_id: String
    assessment_score: Int
    assessment_question_responses: [SessionResponse!]!
    createdAt: Date
  }

  type SessionResponse {
    _id: ID
    question_id: String
    selected_answer_option: String
    right_wrong: Boolean
    createdAt: Date
  }

  type AssessmentSession {
    student: Student
    assessment: Assessment
    questions: [SessionQuestions]
    count: Int
  }

  type SessionQuestions {
    _id: ID
    question_statement: String
    answer_options: [ReadOnlyOptions]
  }

  type ReadOnlyOptions {
    _id: ID
    option_statement: String
  }

  input SessionResponseInput {
    question_id: String
    selected_answer_option: String
  }
  input Student_CSV_Batch {
    full_name: String
    email: String
    phone_number: String
  }
  type SessionResponseType {
    question_id: String
    selected_answer_option: String
    is_correct: Boolean
  }
  type SessionReviewType {
    question_id: String
    selected_answer_option: String
    correct_answer_option: String
    is_correct: Boolean
  }

  input SubmitAssessmentTest {
    student_id: String
    assessment_id: String
    question_response_pairs: [SessionResponseInput]
  }

  type AssessmentResult {
    student_id: String
    assessment_id: String
    assessment_score: Float
    pass_fail: Boolean
    question_response_pairs: [SessionResponseType]
  }
  type AssessmentResultReview {
    student_id: String
    assessment_id: String
    session_qa_review: [SessionReviewType]
  }

  type TestSessionResponse {
    message: String
    count: Int
    result: AssessmentResult
  }

  enum GoogleAuthType {
    ADMIN_LOGIN
    ADMIN_SIGNUP
  }
`;
