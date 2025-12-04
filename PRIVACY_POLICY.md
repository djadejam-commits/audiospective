# Privacy Policy

**Effective Date:** December 4, 2025
**Last Updated:** December 4, 2025

## Introduction

Welcome to Spotify Time Machine ("we," "our," or "us"). We are committed to protecting your privacy and being transparent about how we collect, use, and safeguard your personal information.

This Privacy Policy explains:
- What information we collect and why
- How we use your information
- Your rights and choices regarding your data
- How we protect your information

By using Spotify Time Machine, you agree to the collection and use of information in accordance with this policy.

---

## 1. Information We Collect

### 1.1 Information from Spotify

When you connect your Spotify account, we collect:

- **Profile Information:** Your Spotify username, display name, email address, and profile picture
- **Listening History:** Information about the songs, artists, albums, and playlists you listen to
- **Playback Data:** Timestamps of when you played tracks, play duration, and listening context
- **Top Artists and Tracks:** Your most listened to artists and tracks over various time periods
- **Audio Features:** Technical attributes of tracks (tempo, energy, danceability, etc.)

We only access information that you explicitly authorize through Spotify's OAuth consent screen.

### 1.2 Information We Generate

- **Statistics and Insights:** Aggregated data about your listening habits (e.g., top genres, listening trends)
- **Archive Snapshots:** Historical records of your listening data at specific points in time
- **Share Reports:** Public-facing summaries you choose to generate and share

### 1.3 Automatically Collected Information

- **Usage Data:** Pages visited, features used, time spent on the application
- **Device Information:** Browser type, operating system, IP address (anonymized)
- **Cookies:** Session cookies for authentication and functionality (see Section 6)

### 1.4 Information You Provide

- **Account Settings:** Preferences for archival frequency, privacy settings
- **Feedback:** Communications you send us (support requests, bug reports)

---

## 2. How We Use Your Information

We use your information for the following purposes:

### 2.1 Core Functionality

- **Display Your Statistics:** Show your listening history, top artists, tracks, and genres
- **Archive Your Data:** Automatically save snapshots of your listening history over time
- **Generate Insights:** Create personalized analytics about your music taste
- **Enable Sharing:** Allow you to create and share public listening reports

### 2.2 Service Improvement

- **Performance Monitoring:** Track application performance and identify issues
- **Error Detection:** Monitor and fix technical problems using error logs
- **Usage Analytics:** Understand how users interact with the application to improve features

### 2.3 Security and Compliance

- **Prevent Abuse:** Rate limiting and fraud detection
- **Legal Compliance:** Comply with applicable laws and regulations
- **Enforce Terms:** Enforce our Terms of Service

### 2.4 Communication

- **Service Notifications:** Inform you about important changes or issues
- **Account Updates:** Send you information about your account or data
- **Marketing:** With your consent, send you updates about new features (you can opt out)

---

## 3. Data Storage and Retention

### 3.1 Where We Store Data

- **Database:** PostgreSQL database hosted by Neon (located in US/EU regions)
- **Caching:** Redis cache hosted by Upstash (for temporary data and rate limiting)
- **Application Hosting:** Vercel (serverless infrastructure in global edge locations)

### 3.2 How Long We Keep Data

- **Listening History:** We retain your listening data indefinitely while your account is active
- **Archive Snapshots:** Stored permanently unless you delete them
- **Session Data:** Cleared when you log out or after 30 days of inactivity
- **Logs and Analytics:** Retained for up to 90 days

### 3.3 Data After Account Deletion

When you delete your account, we:
- Permanently delete all your personal data within 30 days
- Anonymize any aggregated statistics (removing all personally identifiable information)
- Remove all archive snapshots and shared reports

---

## 4. Third-Party Services

We use the following third-party services to operate Spotify Time Machine:

### 4.1 Spotify

- **Purpose:** Authentication and data retrieval
- **Data Shared:** Spotify access tokens (we do not store your Spotify password)
- **Privacy Policy:** [https://www.spotify.com/privacy](https://www.spotify.com/privacy)

### 4.2 Vercel

- **Purpose:** Application hosting and deployment
- **Data Shared:** Application logs, request metadata
- **Privacy Policy:** [https://vercel.com/legal/privacy-policy](https://vercel.com/legal/privacy-policy)

### 4.3 Upstash

- **Purpose:** Redis caching and rate limiting
- **Data Shared:** Temporary session data, rate limit counters
- **Privacy Policy:** [https://upstash.com/trust/privacy](https://upstash.com/trust/privacy)

### 4.4 Sentry

- **Purpose:** Error monitoring and performance tracking
- **Data Shared:** Error logs, stack traces, anonymized user IDs
- **Privacy Policy:** [https://sentry.io/privacy](https://sentry.io/privacy)

### 4.5 Neon

- **Purpose:** PostgreSQL database hosting
- **Data Shared:** All user data stored in the database
- **Privacy Policy:** [https://neon.tech/privacy-policy](https://neon.tech/privacy-policy)

### 4.6 QStash (Upstash)

- **Purpose:** Background job scheduling (automated archival)
- **Data Shared:** User IDs for scheduled archival tasks
- **Privacy Policy:** [https://upstash.com/trust/privacy](https://upstash.com/trust/privacy)

---

## 5. Your Rights (GDPR Compliance)

If you are located in the European Economic Area (EEA), you have the following rights:

### 5.1 Right to Access

You can access all your data at any time through:
- Your dashboard: View all statistics and archive snapshots
- Data export: Download all your data in JSON format via `/api/export`

### 5.2 Right to Deletion (Right to be Forgotten)

You can delete your account and all associated data:
- Go to Settings → Delete Account
- Or use the API endpoint: `DELETE /api/user/delete`
- All data will be permanently deleted within 30 days

### 5.3 Right to Data Portability

You can export your data in machine-readable format:
- Download JSON export from Settings → Export Data
- Or use the API endpoint: `GET /api/export`

### 5.4 Right to Rectification

You can correct inaccurate data:
- Update your profile information in Settings
- Re-authenticate with Spotify to refresh your profile data

### 5.5 Right to Restriction

You can restrict data processing:
- Pause automatic archival in Settings
- Disconnect Spotify integration (limited functionality)

### 5.6 Right to Object

You can object to data processing:
- Opt out of analytics tracking
- Delete your account entirely

### 5.7 Right to Lodge a Complaint

You can file a complaint with your local data protection authority if you believe we are not complying with GDPR.

---

## 6. Cookies and Tracking

### 6.1 Essential Cookies

We use cookies that are strictly necessary for the application to function:

- **Session Cookies:** Maintain your logged-in state (expires when you log out)
- **CSRF Tokens:** Prevent cross-site request forgery attacks
- **Authentication Tokens:** Securely store your Spotify access tokens

### 6.2 Analytics Cookies

With your consent, we use:

- **Vercel Analytics:** Track page views and user interactions (anonymized)
- **Performance Monitoring:** Measure page load times and application performance

### 6.3 Cookie Consent

On your first visit, we will ask for your consent to use non-essential cookies. You can:
- Accept all cookies
- Reject non-essential cookies
- Change your preferences at any time in Settings

### 6.4 Third-Party Cookies

We do not use third-party advertising cookies or tracking pixels.

---

## 7. Data Security

We implement industry-standard security measures to protect your data:

### 7.1 Technical Safeguards

- **Encryption in Transit:** All data transmitted over HTTPS/TLS
- **Encryption at Rest:** Database encryption provided by Neon
- **Secure Authentication:** OAuth 2.0 with Spotify, secure session management
- **Rate Limiting:** Protection against brute force and DDoS attacks
- **Input Validation:** All API inputs validated to prevent injection attacks

### 7.2 Access Controls

- **Least Privilege:** Team members only access data necessary for their role
- **Audit Logs:** All data access is logged and monitored
- **Multi-Factor Authentication:** Required for all administrative access

### 7.3 Incident Response

In the event of a data breach, we will:
- Notify affected users within 72 hours
- Report to relevant authorities as required by law
- Take immediate steps to mitigate the breach
- Conduct a post-incident review and implement improvements

---

## 8. Children's Privacy

Spotify Time Machine is not intended for users under 13 years of age. We do not knowingly collect information from children under 13.

If you are a parent or guardian and believe your child has provided us with personal information, please contact us at [contact email] and we will delete the information immediately.

---

## 9. International Data Transfers

We are based in [Your Country] and our servers are located in the United States and European Union.

If you are accessing Spotify Time Machine from outside these regions, your data may be transferred to and processed in these jurisdictions.

We ensure adequate safeguards are in place:
- Standard Contractual Clauses (SCCs) with third-party processors
- GDPR-compliant data processing agreements
- Data Protection Impact Assessments (DPIAs)

---

## 10. California Privacy Rights (CCPA)

If you are a California resident, you have additional rights:

### 10.1 Right to Know

You can request information about:
- Categories of personal information we collect
- Sources of personal information
- Business purposes for collection
- Third parties we share data with

### 10.2 Right to Delete

You can request deletion of your personal information (with certain exceptions).

### 10.3 Right to Opt-Out

You can opt out of the "sale" of personal information. **Note:** We do not sell your personal information.

### 10.4 Right to Non-Discrimination

We will not discriminate against you for exercising your CCPA rights.

To exercise these rights, contact us at [contact email].

---

## 11. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. Changes will be:

- Posted on this page with an updated "Last Updated" date
- Notified to you via email (for material changes)
- Effective immediately upon posting (unless otherwise stated)

We encourage you to review this Privacy Policy periodically.

---

## 12. Data Protection Officer

For questions about data protection, contact our Data Protection Officer:

**Email:** [dpo@yourdomain.com]
**Response Time:** Within 30 days

---

## 13. Contact Us

If you have questions about this Privacy Policy or our data practices:

**Email:** [privacy@yourdomain.com]
**Website:** [https://yourdomain.com/contact](https://yourdomain.com/contact)
**Mail:** [Your Physical Address]

We will respond to all requests within 30 days.

---

## 14. Legal Basis for Processing (GDPR)

We process your personal data under the following legal bases:

- **Consent:** You have given explicit consent (e.g., connecting your Spotify account)
- **Contractual Necessity:** Processing is necessary to provide the service
- **Legitimate Interest:** Processing is necessary for our legitimate interests (e.g., security, fraud prevention)
- **Legal Obligation:** Processing is required by law

You can withdraw consent at any time by disconnecting your Spotify account or deleting your account.

---

## 15. Automated Decision Making

We do not use automated decision-making or profiling that produces legal effects or significantly affects you.

---

## Acknowledgment

By using Spotify Time Machine, you acknowledge that you have read and understood this Privacy Policy.

---

**Spotify Time Machine Privacy Policy - Version 1.0**
**Effective Date:** December 4, 2025
