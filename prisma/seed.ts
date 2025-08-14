import { PrismaClient, UserRole, LoanStatus, DocumentType, NotificationType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Hash password for admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)

  // Create Super Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aopecredit.com' },
    update: {},
    create: {
      email: 'admin@aopecredit.com',
      firstName: 'Super',
      lastName: 'Admin',
      name: 'Super Admin',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
      isActive: true,
    },
  })

  // Create Loan Officer
  const officer = await prisma.user.upsert({
    where: { email: 'officer@aopecredit.com' },
    update: {},
    create: {
      email: 'officer@aopecredit.com',
      firstName: 'Loan',
      lastName: 'Officer',
      name: 'Loan Officer',
      password: hashedPassword,
      role: UserRole.LOAN_OFFICER,
      emailVerified: true,
      isActive: true,
    },
  })

  // Create Approver
  const approver = await prisma.user.upsert({
    where: { email: 'approver@aopecredit.com' },
    update: {},
    create: {
      email: 'approver@aopecredit.com',
      firstName: 'Loan',
      lastName: 'Approver',
      name: 'Loan Approver',
      password: hashedPassword,
      role: UserRole.APPROVER,
      emailVerified: true,
      isActive: true,
    },
  })

  // Create test applicants
  const applicant1 = await prisma.user.upsert({
    where: { email: 'applicant1@example.com' },
    update: {},
    create: {
      email: 'applicant1@example.com',
      firstName: 'John',
      lastName: 'Doe',
      name: 'John Doe',
      password: hashedPassword,
      role: UserRole.APPLICANT,
      emailVerified: true,
      isActive: true,
      phoneNumber: '+2348012345678',
      address: '123 Main Street, Eruwa, Oyo State, Nigeria',
    },
  })

  const applicant2 = await prisma.user.upsert({
    where: { email: 'applicant2@example.com' },
    update: {},
    create: {
      email: 'applicant2@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      name: 'Jane Smith',
      password: hashedPassword,
      role: UserRole.APPLICANT,
      emailVerified: true,
      isActive: true,
      phoneNumber: '+2348087654321',
      address: '456 Park Avenue, Eruwa, Oyo State, Nigeria',
    },
  })

  // Create sample loan applications
  const application1 = await prisma.loanApplication.create({
    data: {
      applicantId: applicant1.id,
      amount: 500000,
      purpose: 'Business expansion',
      duration: 12,
      interestRate: 15.5,
      monthlyIncome: 150000,
      employmentStatus: 'EMPLOYED',
      employerName: 'ABC Company Ltd',
      workExperience: 5,
      phoneNumber: '+2348012345678',
      address: '123 Main Street, Eruwa, Oyo State, Nigeria',
      accountNumber: '1234567890',
      bankName: 'First Bank of Nigeria',
      status: LoanStatus.PENDING,
    },
  })

  const application2 = await prisma.loanApplication.create({
    data: {
      applicantId: applicant2.id,
      amount: 1000000,
      purpose: 'Home renovation',
      duration: 24,
      interestRate: 18.0,
      monthlyIncome: 250000,
      employmentStatus: 'SELF_EMPLOYED',
      employerName: 'Jane\'s Boutique',
      workExperience: 8,
      phoneNumber: '+2348087654321',
      address: '456 Park Avenue, Eruwa, Oyo State, Nigeria',
      accountNumber: '0987654321',
      bankName: 'Zenith Bank',
      status: LoanStatus.UNDER_REVIEW,
    },
  })

  const application3 = await prisma.loanApplication.create({
    data: {
      applicantId: applicant1.id,
      amount: 200000,
      purpose: 'Emergency medical expenses',
      duration: 6,
      interestRate: 20.0,
      monthlyIncome: 150000,
      employmentStatus: 'EMPLOYED',
      employerName: 'ABC Company Ltd',
      workExperience: 5,
      phoneNumber: '+2348012345678',
      address: '123 Main Street, Eruwa, Oyo State, Nigeria',
      accountNumber: '1234567890',
      bankName: 'First Bank of Nigeria',
      status: LoanStatus.APPROVED,
      approvedAt: new Date(),
    },
  })

  // Create sample documents
  await prisma.document.createMany({
    data: [
      {
        applicationId: application1.id,
        type: DocumentType.ID_CARD,
        fileName: 'id_card.jpg',
        filePath: '/uploads/documents/id_card.jpg',
        fileSize: 1024000,
        mimeType: 'image/jpeg',
      },
      {
        applicationId: application1.id,
        type: DocumentType.BANK_STATEMENT,
        fileName: 'bank_statement.pdf',
        filePath: '/uploads/documents/bank_statement.pdf',
        fileSize: 2048000,
        mimeType: 'application/pdf',
      },
      {
        applicationId: application2.id,
        type: DocumentType.PASSPORT,
        fileName: 'passport.png',
        filePath: '/uploads/documents/passport.png',
        fileSize: 512000,
        mimeType: 'image/png',
      },
    ],
  })

  // Create sample reviews
  await prisma.loanReview.create({
    data: {
      applicationId: application2.id,
      reviewerId: officer.id,
      reviewType: 'OFFICER_REVIEW',
      status: 'APPROVED',
      comments: 'Applicant has good credit history and stable income.',
      recommendation: 'Recommend for approval',
    },
  })

  // Create sample loans
  await prisma.loan.create({
    data: {
      applicationId: application3.id,
      approvedAmount: 200000,
      disbursementAmount: 200000,
      interestRate: 20.0,
      duration: 6,
      monthlyPayment: 36666.67,
      disbursementDate: new Date(),
      bankAccount: '1234567890',
      bankName: 'First Bank of Nigeria',
      createdBy: admin.id,
      totalRepayment: 220000, 
    },
  })

  // Create sample notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: officer.id,
        type: NotificationType.APPLICATION_SUBMITTED,
        title: 'New Loan Application',
        message: 'A new loan application has been submitted for review.',
        loanApplicationId: application1.id,
      },
      {
        userId: approver.id,
        type: NotificationType.APPLICATION_REVIEWED,
        title: 'Application Ready for Approval',
        message: 'A loan application has been reviewed and is ready for your approval.',
        loanApplicationId: application2.id,
      },
      {
        userId: applicant1.id,
        type: NotificationType.APPLICATION_APPROVED,
        title: 'Loan Approved',
        message: 'Your loan application has been approved!',
        loanApplicationId: application3.id,
      },
    ],
  })

  // Create audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'CREATE_USER',
        entityType: 'User',
        entityId: officer.id,
        oldValues: null,
        newValues: JSON.stringify({
          email: 'officer@aopecredit.com',
          role: 'LOAN_OFFICER',
        }),
      },
      {
        userId: applicant1.id,
        action: 'SUBMIT_APPLICATION',
        entityType: 'LoanApplication',
        entityId: application1.id,
        oldValues: null,
        newValues: JSON.stringify({
          amount: 500000,
          purpose: 'Business expansion',
        }),
      },
      {
        userId: officer.id,
        action: 'REVIEW_APPLICATION',
        entityType: 'LoanApplication',
        entityId: application2.id,
        oldValues: null,
        newValues: JSON.stringify({
          status: 'UNDER_REVIEW',
        }),
      },
    ],
  })

  // Create sample interest rates
  await prisma.interestRate.createMany({
    data: [
      {
        months: 6,
        rate: 25.0,
        adminId: admin.id,
      },
      {
        months: 12,
        rate: 27.0,
        adminId: admin.id,
      },
      {
        months: 24,
        rate: 30.0,
        adminId: admin.id,
      },
      {
        months: 36,
        rate: 32.0,
        adminId: admin.id,
      },
      {
        months: 48,
        rate: 35.0,
        adminId: admin.id,
      },
      {
        months: 60,
        rate: 38.0,
        adminId: admin.id,
      },
    ],
  })

  console.log('✅ Database seeded successfully!')
  console.log('🔑 Admin credentials: admin@aopecredit.com / admin123')
  console.log('🔑 Officer credentials: officer@aopecredit.com / admin123')
  console.log('🔑 Approver credentials: approver@aopecredit.com / admin123')
  console.log('🔑 Applicant credentials: applicant1@example.com / admin123')
  console.log('🔑 Applicant credentials: applicant2@example.com / admin123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })