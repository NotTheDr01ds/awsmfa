# awsmfa
# Updates AWS credentials to allow MFA use with aws-cli

## Configuration:

For your IAM user, add the following policy to enforce 2FA on the CLI:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "DenyAllWhenMFAIsNotPresent",
            "Effect": "Deny",
            "NotAction": [
                "iam:ListMFADevices",
                "sts:GetSessionToken"
            ],
            "Resource": "*",
            "Condition": {
                "BoolIfExists": {
                    "aws:MultiFactorAuthPresent": false
                }
            }
        },
        {
            "Sid": "DenyAllWhenMFAIsOlderThanFourHours",
            "Effect": "Deny",
            "NotAction": [
                "iam:ListMFADevices",
                "sts:GetSessionToken"
            ],
            "Resource": "*",
            "Condition": {
                "NumericGreaterThanIfExists": {
                    "aws:MultiFactorAuthAge": "14400"
                }
            }
        }
    ]

}
```

Adjust the MultiFactorAuthAge as desired.  The expiration time in this policy is set to 4 hours.  This policy will only allow access to the GetSessionToken and ListMFADevices API's unless credentials are used which have been provided through the MFA.

In your ~/.aws/credentials (or equivalent) file, create a new section called [{profile}mfa], where profile is the profilename you will use with the AWS SDK.  

Just as with any profile to be used with the AWS SDK, you will need ```aws_access_key```, and ```aws_secret_access_key``` parameters.  You will also need a new parameter named ```mfa_serial```, which should be set to the arn of your MFA device. The MFA arn can be found in the IAM console, under "Security credentials" for the user.  Or via the ```aws iam list-mfa-devices``` command.

For instance, if your profile is "george", then the section will look something like this:

```
[georgemfa]
mfa_serial=arn:aws:iam::00000000000:mfa/georgeuser
aws_access_key_id=XXXXXXXXXXXXXXXXXXXXXXXX
aws_secret_access_key=XXXXXXXXXXXXXXXXXXXXXXXXX
```
