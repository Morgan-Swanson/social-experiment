# AWS IAM Setup for GitHub Actions Deployment

This guide provides detailed step-by-step instructions for creating an IAM user with appropriate permissions for GitHub Actions to deploy your application to AWS using Terraform.

## Prerequisites

- AWS Account (create at https://aws.amazon.com if you don't have one)
- GitHub repository admin access
- ~15 minutes

## Part 1: Create IAM User for GitHub Actions

### Step 1: Access IAM Console

1. Log into AWS Console at https://console.aws.amazon.com
2. In the top search bar, type "IAM" and press Enter
3. Click on "IAM" (Identity and Access Management)

### Step 2: Create New User

1. In the left sidebar, click **"Users"**
2. Click the **"Create user"** button (orange button on the right)
3. Enter user details:
   - **User name**: `github-actions-deploy`
   - **Provide user access to the AWS Management Console**: Leave UNCHECKED (this is a programmatic user)
4. Click **"Next"**

### Step 3: Attach Permissions

You have two options for permissions:

#### Option A: Full Admin Access (Simplest - Recommended for Beta)

1. Select **"Attach policies directly"**
2. In the search box, type: `AdministratorAccess`
3. Check the box next to **"AdministratorAccess"**
4. Click **"Next"**

**Note**: This gives full AWS access. For production, use Option B with least-privilege permissions.

#### Option B: Least-Privilege Permissions (Production Best Practice)

1. Select **"Attach policies directly"**
2. Search and select each of these policies:
   - `AmazonRDSFullAccess` (for database management)
   - `AmazonS3FullAccess` (for storage)
   - `SecretsManagerReadWrite` (for secrets)
   - `CloudWatchLogsFullAccess` (for logging)
   - `IAMFullAccess` (for role creation)
   - `AWSAmplifyFullAccess` (for hosting)
   - `AmazonVPCFullAccess` (for networking)
3. Click **"Next"**

### Step 4: Review and Create

1. Review the user details
2. Click **"Create user"**
3. You'll see a success message

## Part 2: Create Access Keys

### Step 1: Navigate to User

1. In the Users list, click on **"github-actions-deploy"**
2. Click the **"Security credentials"** tab

### Step 2: Create Access Key

1. Scroll down to **"Access keys"** section
2. Click **"Create access key"**
3. Select use case: **"Command Line Interface (CLI)"**
4. Check the confirmation box at the bottom
5. Click **"Next"**

### Step 3: Add Description (Optional)

1. Description tag: `GitHub Actions Terraform Deployment`
2. Click **"Create access key"**

### Step 4: Save Your Credentials

**CRITICAL: You can only see the Secret Access Key once!**

You'll see:
- **Access key ID**: Starts with `AKIA...`
- **Secret access key**: A long random string

**Do one of the following:**
1. Click **"Download .csv file"** and save it securely
2. Copy both values to a password manager
3. Leave this tab open until you've added them to GitHub

**NEVER commit these to your repository or share them publicly!**

## Part 3: Add Secrets to GitHub

### Step 1: Navigate to Repository Settings

1. Go to your GitHub repository: https://github.com/Morgan-Swanson/social-experiment
2. Click **"Settings"** tab (top right)
3. In the left sidebar, expand **"Secrets and variables"**
4. Click **"Actions"**

### Step 2: Add AWS Access Key ID

1. Click **"New repository secret"**
2. Name: `AWS_ACCESS_KEY_ID`
3. Secret: Paste your **Access key ID** (starts with AKIA)
4. Click **"Add secret"**

### Step 3: Add AWS Secret Access Key

1. Click **"New repository secret"** again
2. Name: `AWS_SECRET_ACCESS_KEY`
3. Secret: Paste your **Secret access key**
4. Click **"Add secret"**

### Step 4: Add OpenAI API Key

1. Get your OpenAI API key from: https://platform.openai.com/api-keys
2. Click **"New repository secret"**
3. Name: `TF_VAR_openai_api_key`
4. Secret: Paste your OpenAI API key (starts with sk-)
5. Click **"Add secret"**

### Step 5: Generate and Add NextAuth Secret

1. Open Terminal and run:
   ```bash
   openssl rand -base64 32
   ```
2. Copy the output
3. In GitHub, click **"New repository secret"**
4. Name: `TF_VAR_nextauth_secret`
5. Secret: Paste the generated secret
6. Click **"Add secret"**

### Step 6: Verify All Secrets

You should now have 4 repository secrets:
1. `AWS_ACCESS_KEY_ID`
2. `AWS_SECRET_ACCESS_KEY`
3. `TF_VAR_openai_api_key`
4. `TF_VAR_nextauth_secret`

## Part 4: Test the Setup

### Option 1: Merge PR #6 to Main

Simply merge PR #6 - GitHub Actions will automatically deploy to AWS.

### Option 2: Manual Test (Recommended)

1. Go to **Actions** tab in GitHub
2. Select **"Deploy to Production"** workflow
3. Click **"Run workflow"** dropdown
4. Select branch: **"develop"** (for testing)
5. Click **"Run workflow"**
6. Watch the workflow run - it should complete successfully in ~15 minutes

If successful, you'll see green checkmarks and deployment information in the workflow summary.

## Security Best Practices

### Immediate Actions:
1. ✅ Store access keys in GitHub Secrets (done)
2. ✅ Never commit keys to repository
3. ✅ Enable MFA on AWS root account

### Ongoing Actions:
1. **Rotate Access Keys** every 90 days:
   - Create new access key
   - Update GitHub secrets
   - Delete old access key

2. **Monitor IAM Activity**:
   - AWS Console > IAM > Users > github-actions-deploy
   - Check "Last activity" regularly

3. **Review CloudTrail Logs**:
   - Ensure only expected actions are being performed

4. **Enable AWS Billing Alerts**:
   - Set up alert if costs exceed $100/month
   - AWS Console > Billing > Billing preferences

## Troubleshooting

### "Access Denied" Error in GitHub Actions

**Cause**: IAM user lacks required permissions

**Solution**:
1. Go to IAM Console
2. Click on user `github-actions-deploy`
3. Verify AdministratorAccess policy is attached
4. Or add missing specific policies

### "Invalid Access Key" Error

**Cause**: Incorrect key in GitHub Secrets

**Solution**:
1. Go to IAM Console > Users > github-actions-deploy > Security credentials
2. Create new access key
3. Update GitHub Secrets with new values
4. Delete old access key in AWS

### Terraform State Lock Error

**Cause**: Previous deployment didn't complete

**Solution**:
1. Wait 15 minutes for lock to expire
2. Or manually release lock in AWS Console (advanced)

## Next Steps

After setup is complete:
1. Review and merge PR #6 to deploy to production
2. Monitor the GitHub Actions workflow
3. Follow post-deployment steps in .github/DEPLOYMENT.md

## Cost Monitoring

Keep an eye on costs:
- Go to AWS Cost Explorer
- Expected: $30-80/month for beta
- Set up billing alert if exceeds $100/month

## Support

If you encounter issues:
- Check GitHub Actions logs for detailed error messages
- Review AWS CloudTrail for IAM-related issues
- Open a GitHub issue with error details