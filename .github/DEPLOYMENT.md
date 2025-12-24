# Production Deployment Guide

This document describes how the production deployment workflow works.

## Automatic Deployment

Every push to the `main` branch triggers automatic deployment to AWS via GitHub Actions.

The workflow:
1. Runs terraform to provision/update AWS infrastructure
2. Outputs deployment information
3. AWS Amplify auto-deploys the application

## Required GitHub Secrets

Configure these in GitHub Settings > Secrets and variables > Actions:

### AWS Credentials
- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret access key

### Terraform Variables
- `TF_VAR_openai_api_key` - OpenAI API key (from https://platform.openai.com/api-keys)
- `TF_VAR_nextauth_secret` - Generate with: `openssl rand -base64 32`

## Setup Instructions

### 1. Create AWS IAM User for GitHub Actions

```bash
# In AWS Console:
# 1. Go to IAM > Users > Create user
# 2. Name: github-actions-deploy
# 3. Attach policies:
#    - AdministratorAccess (for terraform to manage all resources)
# 4. Create access key > CLI
# 5. Save the Access Key ID and Secret Access Key
```

### 2. Add GitHub Secrets

```bash
# In GitHub repository:
# Settings > Secrets and variables > Actions > New repository secret

# Add each secret:
AWS_ACCESS_KEY_ID = <your-aws-access-key-id>
AWS_SECRET_ACCESS_KEY = <your-aws-secret-access-key>
TF_VAR_openai_api_key = <your-openai-api-key>
TF_VAR_nextauth_secret = <generate-with-openssl-rand>
```

### 3. First Deployment

1. Merge PR to main (triggers automatic deployment)
2. Wait for GitHub Actions workflow to complete (~15 minutes)
3. Go to AWS Amplify Console
4. Click "Connect GitHub" and authorize
5. Add environment variables from Secrets Manager:
   - DATABASE_URL
   - OPENAI_API_KEY
   - NEXTAUTH_SECRET
6. Trigger first Amplify deployment

### 4. Subsequent Deployments

After initial setup, every merge to main:
- Automatically updates AWS infrastructure via terraform
- Automatically deploys app via Amplify

## Manual Deployment

You can also trigger deployment manually:

1. Go to Actions tab in GitHub
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Select "main" branch
5. Click "Run workflow"

## Monitoring

- **GitHub Actions**: Check workflow status in Actions tab
- **AWS Amplify**: Monitor deployments in Amplify Console
- **CloudWatch**: View logs and metrics in AWS CloudWatch
- **RDS**: Monitor database in RDS Console

## Rollback

If a deployment fails:

1. Revert the problematic commit on main
2. Push to main (triggers automatic redeployment)

Or manually:

1. Go to Amplify Console
2. Find previous successful deployment
3. Click "Redeploy this version"

## Cost Monitoring

Monitor costs in AWS Cost Explorer:
- Expected: $30-80/month for beta (<10 users)
- Set up billing alerts if costs exceed $100/month

## Troubleshooting

### Terraform Apply Fails
- Check AWS credentials are valid
- Verify GitHub secrets are set correctly
- Review terraform error in GitHub Actions logs

### Amplify Build Fails
- Check build logs in Amplify Console
- Verify environment variables are set
- Ensure DATABASE_URL is accessible

### Database Connection Issues
- Verify security groups allow access
- Check DATABASE_URL is correct in Amplify
- Confirm RDS instance is running

## Security Notes

- Never commit secrets to the repository
- Rotate AWS access keys regularly
- Use least-privilege IAM policies in production
- Enable MFA on AWS root account
- Review CloudWatch alarms regularly