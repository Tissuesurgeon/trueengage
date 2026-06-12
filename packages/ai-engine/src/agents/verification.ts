import { VerificationResultSchema } from '@trueengage/shared';
import type { CampaignRules, SubmissionProof, VerificationResult } from '@trueengage/shared';
import { callVenice, type VeniceConfig } from '../callVenice.js';
import {
  combinedPageText,
  descriptionPageOverlap,
  fetchProofContent,
  type ProofFetchResult,
} from '../fetchProofContent.js';
import { buildVerificationPrompt } from '../prompt.js';

function heuristicFallback(
  rules: CampaignRules,
  submission: SubmissionProof,
  proofFetch?: ProofFetchResult,
): VerificationResult {
  const desc = submission.description.toLowerCase();
  const pageText = proofFetch ? combinedPageText(proofFetch) : '';
  const checkText = pageText ? `${desc} ${pageText}` : desc;

  let score = 60;
  let requirementMatch = 50;
  let authenticity = 55;
  const reasons: string[] = [];

  if (submission.url) {
    const urlFetch = proofFetch?.proofUrl;
    if (!urlFetch) {
      score += 5;
      reasons.push('URL provided (not pre-fetched)');
    } else if (!urlFetch.reachable) {
      score -= 35;
      authenticity -= 40;
      requirementMatch -= 30;
      reasons.push(
        `Proof URL unreachable${urlFetch.fetchError ? `: ${urlFetch.fetchError}` : ''}`,
      );
    } else {
      score += 15;
      requirementMatch += 20;
      authenticity += 20;
      reasons.push(`Proof URL reachable (HTTP ${urlFetch.httpStatus})`);

      if (pageText) {
        const overlap = descriptionPageOverlap(submission.description, pageText);
        if (overlap >= 0.25) {
          score += 10;
          authenticity += 15;
          reasons.push(`Description aligns with page content (${Math.round(overlap * 100)}% overlap)`);
        } else if (overlap < 0.1) {
          score -= 20;
          authenticity -= 25;
          reasons.push('Description poorly matches fetched page content');
        }
      }
    }
  }

  if (submission.screenshotUrl) {
    const shot = proofFetch?.screenshot;
    if (shot?.reachable) {
      score += 5;
      authenticity += 5;
      reasons.push('Screenshot URL verified');
    } else if (shot && !shot.reachable) {
      score -= 5;
      reasons.push(`Screenshot unreachable${shot.fetchError ? `: ${shot.fetchError}` : ''}`);
    }
  }

  if (rules.requiredHashtag && checkText.includes(rules.requiredHashtag.toLowerCase())) {
    score += 10;
    requirementMatch += 20;
    reasons.push(`Hashtag ${rules.requiredHashtag} found`);
  } else if (rules.requiredHashtag) {
    score -= 15;
    reasons.push(`Missing hashtag ${rules.requiredHashtag}`);
  }

  if (rules.requiredMention && checkText.includes(rules.requiredMention.toLowerCase())) {
    score += 10;
    requirementMatch += 20;
    reasons.push(`Mention ${rules.requiredMention} found`);
  } else if (rules.requiredMention) {
    score -= 15;
    reasons.push(`Missing mention ${rules.requiredMention}`);
  }

  const wordCount = submission.description.split(/\s+/).length;
  if (rules.minWordCount && wordCount >= rules.minWordCount) {
    score += 10;
    requirementMatch += 10;
    reasons.push(`Word count ${wordCount} meets minimum ${rules.minWordCount}`);
  } else if (rules.minWordCount) {
    score -= 10;
    reasons.push(`Word count ${wordCount} below minimum ${rules.minWordCount}`);
  }

  score = Math.max(0, Math.min(100, score));
  requirementMatch = Math.max(0, Math.min(100, requirementMatch));
  authenticity = Math.max(0, Math.min(100, authenticity));

  const urlRequired = rules.proofTypes.includes('url');
  const urlFailed = urlRequired && submission.url && proofFetch?.proofUrl && !proofFetch.proofUrl.reachable;

  const approved = !urlFailed && score >= 70 && requirementMatch >= 60;

  return {
    approved,
    score,
    quality: score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low',
    requirementMatch,
    authenticity,
    spamRisk: score < 40 ? 'high' : score < 60 ? 'medium' : 'low',
    reason: approved
      ? `Task requirements satisfied: ${reasons.join('; ')}`
      : `Submission does not meet requirements: ${reasons.join('; ')}`,
  };
}

export interface VerifySubmissionOutput {
  result: VerificationResult;
  proofFetch: ProofFetchResult;
}

export async function verifySubmission(
  config: VeniceConfig,
  campaignRules: CampaignRules,
  campaignTitle: string,
  submission: SubmissionProof,
): Promise<VerifySubmissionOutput> {
  const proofFetch = await fetchProofContent(submission);

  const input = buildVerificationPrompt({
    campaignRules,
    campaignTitle,
    submission,
    proofFetch,
  });

  const result = await callVenice(
    config,
    'verification',
    JSON.parse(input),
    VerificationResultSchema,
    () => heuristicFallback(campaignRules, submission, proofFetch),
  );

  return { result, proofFetch };
}
