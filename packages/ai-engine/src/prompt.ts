import type { CampaignRules, SubmissionProof } from '@trueengage/shared';
import type { ProofFetchResult } from './fetchProofContent.js';

export interface VerificationInput {
  campaignRules: CampaignRules;
  campaignTitle: string;
  submission: SubmissionProof;
  proofFetch?: ProofFetchResult;
}

export function buildVerificationPrompt(input: VerificationInput): string {
  return JSON.stringify({
    task: 'verify_submission',
    campaignTitle: input.campaignTitle,
    campaignRules: input.campaignRules,
    submission: input.submission,
    proofFetch: input.proofFetch,
    instructions: [
      'Use proofFetch to verify the linked URL was reachable and that page content matches the participant description',
      'If proofUrl.reachable is false, penalize authenticity and requirementMatch heavily',
      'Compare proofUrl.extractedText, pageTitle, and metaDescription against campaign rules and submission.description',
      'If screenshot.reachable is true, treat it as supplementary proof',
      'Evaluate if the submission satisfies all campaign requirements',
      'Score authenticity (0-100), requirement match (0-100), and overall quality',
      'Detect spam or bot-like content',
      'Approve only if the linked post exists, requirements are substantially met, and description aligns with fetched content',
    ],
    requiredOutputSchema: {
      approved: 'boolean',
      score: 'number 0-100',
      quality: 'low | medium | high',
      requirementMatch: 'number 0-100',
      authenticity: 'number 0-100',
      spamRisk: 'low | medium | high',
      reason: 'string explaining decision',
    },
  });
}
