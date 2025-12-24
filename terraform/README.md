# AWS Production Deployment with Terraform

This directory contains Terraform configuration to deploy the Social Experiment application to AWS for production beta testing.

## Cost Estimate (Monthly)

For <10 beta users:
- **RDS PostgreSQL (db.t3.micro, single-AZ)**: $13
- **S3 Storage**: $1-3 (50GB datasets)
- **AWS Amplify Hosting**: $0-5 (free tier covers most beta usage)
- **Secrets Manager**: $0.80 (3 secrets)
- **CloudWatch**: $3-5 (logs + basic metrics)
- **Data Transfer**: $1-2
- **OpenAI API**: Variable ($10-50/month estimated)

**Total: ~$30-80/month**

## Prerequisites

1. **AWS Account** - Create at https://aws.amazon.com
2. **AWS CLI** - Install and configure with your credentials
   ```bash
   brew install awscli  # macOS
   aws configure
   ```
3. **Terraform** - Install from https://www.terraform.io/downloads
   ```bash
   brew install terraform  # macOS
   ```
4. **GitHub Personal Access Token** - For Amplify deployment
   - Generate at: https://github.com/settings/tokens
   - Required scopes: `repo`, `admin:repo_hook`

## Deployment Steps

### 1. Configure Variables

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and fill in:
- `openai_api_key` - Your OpenAI API key
- `nextauth_secret` - Generate with: `openssl rand -base64 32`
- `github_repo` - Your GitHub repository
- `github_branch` - Branch to deploy (usually `main`)

### 2. Initialize Terraform

```bash
cd terraform
terraform init
```

### 3. Review Infrastructure Plan

```bash
terraform plan
```

This shows what will be created. Review carefully.

### 4. Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted. This takes ~10-15 minutes.

### 5. Connect GitHub to Amplify (Manual Step)

After deployment completes:

1. Go to AWS Amplify Console:
   ```
   https://console.aws.amazon.com/amplify
   ```

2. Click on your app (social-experiment)

3. Click "Connect GitHub" and authorize

4. Select your repository and branch

5. Amplify will auto-deploy on the next git push

### 6. Add Secrets to Amplify

In the Amplify Console:

1. Go to "Environment Variables"
2. Add these variables (retrieve values from AWS Secrets Manager):
   - `DATABASE_URL` - PostgreSQL connection string
   - `OPENAI_API_KEY` - Your OpenAI key
   - `NEXTAUTH_SECRET` - NextAuth secret

### 7. Trigger First Deployment

Push to your configured branch or manually trigger deployment in Amplify Console.

## Accessing Your Application

After deployment completes, your app will be available at:
```
https://main.<unique-id>.amplifyapp.com
```

The exact URL is shown in the Terraform output.

## Database Setup

Connect to your database and run migrations:

```bash
# Get database URL from Terraform output
terraform output -raw database_url

# Set DATABASE_URL environment variable
export DATABASE_URL="<database-url>"

# Run migrations
npm run db:migrate

# (Optional) Seed database
npm run db:seed
```

## Monitoring

- **Application Logs**: CloudWatch Logs at `/aws/amplify/social-experiment`
- **Database Metrics**: RDS Console
- **Alarms**: CloudWatch Alarms (CPU, Storage)

## Costs & Optimization

To reduce costs further:
- Reduce RDS backup retention (currently 7 days)
- Use Amplify free tier build minutes
- Delete old CloudWatch logs after 7 days (already configured)

## Updating Infrastructure

After making changes to `.tf` files:

```bash
terraform plan   # Review changes
terraform apply  # Apply changes
```

## Teardown

To completely remove all AWS resources:

```bash
terraform destroy
```

**Warning**: This deletes your database and all data. Take backups first!

## Troubleshooting

### Database Connection Issues
- Check security group allows inbound on port 5432
- Verify `publicly_accessible = true` in RDS config
- Check DATABASE_URL format is correct

### Amplify Build Failures
- Check build logs in Amplify Console
- Verify environment variables are set correctly
- Ensure GitHub connection is authorized

### High Costs
- Check RDS instance isn't over-provisioned
- Monitor S3 storage usage
- Review OpenAI API usage in their dashboard

## Support

For AWS-specific issues, use AWS Support Center.
For application issues, open a GitHub issue.