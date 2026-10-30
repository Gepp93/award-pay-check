import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  businessName?: string
  contactName?: string
  contactEmail?: string
  industry?: string
  service?: string
  message?: string
}

const Email = ({ businessName, contactName, contactEmail, industry, service, message }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>A new employer enquiry has been securely saved.</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
      <Container style={{ padding: '24px', maxWidth: '600px' }}>
        <Heading style={{ color: '#102F26' }}>AwardPay employer enquiry</Heading>
        <Text>This enquiry has been saved securely. Reply to this email to contact the enquirer.</Text>
        <Section>
          <Text><strong>Business:</strong> {businessName || 'Not provided'}</Text>
          <Text><strong>Contact:</strong> {contactName || 'Not provided'}</Text>
          <Text><strong>Email:</strong> {contactEmail || 'Not provided'}</Text>
          <Text><strong>Industry:</strong> {industry || 'Not provided'}</Text>
          <Text><strong>Service requested:</strong> {service || 'Not provided'}</Text>
          <Text style={{ whiteSpace: 'pre-wrap' }}><strong>Message:</strong>{'\n'}{message || 'Not provided'}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'New AwardPay employer enquiry',
  displayName: 'Employer enquiry notification',
  to: 'support@awardpay.com.au',
  previewData: { businessName: 'Example business', contactName: 'Example contact', contactEmail: 'contact@example.com', industry: 'Hospitality', service: 'Payroll compliance risk review', message: 'Example enquiry for template preview only.' },
} satisfies TemplateEntry