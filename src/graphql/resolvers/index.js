import { GraphQLDateTime } from "graphql-iso-date";

import GoogleResolver from "./google_resolver";
import adminResolver from "./admin-resolvers";
import AssessmentResolver from "../resolvers/assessment_relover";
import AssessmentGroupResolver from "./assessment_group_resolvers";
import StudentResolver from "./student_resolver";
import ExaminerResolver from "./examiner_resolver";
import QuestionResolver from "./assessment_question_resolver";
import StudentSessionResolver from "./student_session_resolver";
import GroupResultResolver from "./group_result_resolver";

//Models
import AssessmentGroup from "../../models/assesment/assessment_group";
import Admin from "../../models/user_types/admin";
import Assessment from "../../models/assesment/assessment";
import Student from "../../models/user_types/student";
import Examiner from "../../models/user_types/examiner";
export default {
  Date: GraphQLDateTime,

  // Exporting all Queries

  // Resolving all Schema types with relationships to other Schema types
  Assessment: {
    group_id: (_, __) => AssessmentGroup.findById(_.group_id),
    assigned_examiners: (_, __) => Examiner.find({ _id: _.assigned_examiners }),
  },
  AssessmentGroup: {
    created_by: (_, __) => Admin.findById(_.created_by),
    //created_by: (_, __) => Admin.find({ _id: _.created_by }),
    enrolled_students: (_, __) => Student.find({ _id: _.enrolled_students }),
  },
  AssessmentQuestion: {
    assessment_id: (_, __) => Assessment.findById(_.assessment_id),
  },

  Student: {},
  Examiner: {
    //invited_by: (_, __) => Admin.find({ _id: _.assigned_examiners }),
  },

  Query: {
    //ADMIN
    admin_login: adminResolver.admin_login,
    admin_profile: adminResolver.admin_profile,

    //ASSESSMENT_GROUP
    admin_assessment_groups: AssessmentGroupResolver.admin_assessment_groups,
    get_one_assessment_group: AssessmentGroupResolver.get_one_assessment_group,
    get_all_assessment_groups:
      AssessmentGroupResolver.get_all_assessment_groups,
    get_student_groups: AssessmentGroupResolver.get_student_groups,

    //ASSESSMENT
    get_all_assessments: AssessmentResolver.get_all_assessments,
    get_assessment: AssessmentResolver.get_assessment,
    assessment_feed: AssessmentResolver.assessment_feed,
    get_admin_assessments: AssessmentResolver.get_admin_assessments,

    //STUDENT
    student_profile: StudentResolver.student_profile,
    get_all_students: StudentResolver.get_all_students,
    eligible_assessments: StudentResolver.eligible_assessments,
    asessment_session_page: StudentSessionResolver.asessment_session_page,
    attempted_assessments: StudentResolver.attempted_assessments,

    //EXAMINER
    examiner_login: ExaminerResolver.examiner_login,
    view_examiner_profile: ExaminerResolver.view_examiner_profile,
    view_invited_examiners: ExaminerResolver.view_invited_examiners,

    //QUESTIONS
    all_assessment_questions: QuestionResolver.all_assessment_questions,
    get_assessment_question: QuestionResolver.get_assessment_question,
  },

  // Exporting all Mutations
  Mutation: {
    // ADMINISTRATOR
    authGoogle: GoogleResolver.authGoogle,
    google_social_login: adminResolver.google_social_login,
    admin_google_login: adminResolver.admin_google_login,
    create_admin: adminResolver.create_admin,
    admin_verification: adminResolver.admin_verification,
    admin_profile_update: adminResolver.admin_profile_update,
    admin_google_login: adminResolver.admin_google_login,
    admin_forgot_password_request: adminResolver.admin_forgot_password_request,
    admin_reset_password_request: adminResolver.admin_reset_password_request,

    // GROUP
    create_assessment_group: AssessmentGroupResolver.create_assessment_group,
    delete_assessment_group: AssessmentGroupResolver.delete_assessment_group,
    enroll_single_student: AssessmentGroupResolver.enroll_single_student,

    //ASSESSMENT
    create_assessment: AssessmentResolver.create_assessment,
    publish_toggle_assessment: AssessmentResolver.publish_toggle_assessment,
    delete_assessment: AssessmentResolver.delete_assessment,

    // EXAMINER
    add_examiner_manually: ExaminerResolver.add_examiner_manually,
    invite_examiner: ExaminerResolver.invite_examiner,
    validate_examiner_email: ExaminerResolver.validate_examiner_email,
    update_examiner_profile: ExaminerResolver.update_examiner_profile,
    assign_examiner: ExaminerResolver.assign_examiner,
    delete_examiner: ExaminerResolver.delete_examiner,
    email_assign_multiple_examiner:
      ExaminerResolver.email_assign_multiple_examiner,

    // QUESTION
    add_assessment_question: QuestionResolver.add_assessment_question,
    add_essay_question: QuestionResolver.add_essay_question,
    edit_assessment_question: QuestionResolver.edit_assessment_question,
    delete_assessment_question: QuestionResolver.delete_assessment_question,

    // STUDENTS
    add_student_manually: StudentResolver.add_student_manually,
    student_login: StudentResolver.student_login,
    delete_student: StudentResolver.delete_student,
    email_enroll_multiple_students:
      StudentResolver.email_enroll_multiple_students,
    csv_enroll_multiple_students: StudentResolver.csv_enroll_multiple_students,
    student_profile_update: StudentResolver.student_profile_update,
    student_password_update: StudentResolver.student_password_update,
    student_forgot_password_request:
      StudentResolver.student_forgot_password_request,
    student_reset_password_request:
      StudentResolver.student_reset_password_request,

    // TEST SESSIONS
    submit_assessment_test: StudentSessionResolver.submit_assessment_test,

    // RESULTS
    compose_group_result: GroupResultResolver.compose_group_result,
  },

  Subscription: {
    session_countdown: StudentSessionResolver.session_countdown,
  },
  // Interface declaration
  User: {
    __resolveType(obj) {
      return "User";
    },
  },
};
