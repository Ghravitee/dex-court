import { ZERO_ADDRESS } from "./config";
import { formatAmount, useCountdown } from "./helper";

export type Milestone = {
  unlockAt: bigint;
  claimed: boolean;
  percentBP: bigint;
  amount: bigint;
  heldByRecipient?: boolean;
};

type MilestoneTableRowProps = {
  milestone: Milestone;
  index: number;
  agreement?: readonly unknown[];
  manageTokenDecimals?: number;
  manageTokenSymbol?: string;
  isServiceProvider?: boolean;
  isServiceRecipient?: boolean;
  onClaimMilestone: (index: number) => void;
  onSetMilestoneHold: (index: number, hold: boolean) => void; // Remove optional flag
};

export function MilestoneTableRow({
  milestone,
  index,
  agreement,
  manageTokenDecimals = 18,
  manageTokenSymbol = 'TOKEN',
  isServiceProvider = false,
  isServiceRecipient = false,
  onClaimMilestone,
  onSetMilestoneHold,
}: MilestoneTableRowProps) {
  const countdown = useCountdown(milestone.unlockAt);
  const now = Math.floor(Date.now() / 1000);
  const isUnlocked = Number(milestone.unlockAt) <= now;
  const canClaim = isUnlocked && !milestone.claimed && isServiceProvider && !milestone.heldByRecipient;
  const canHold = isServiceRecipient && !milestone.claimed; // Service recipient can hold if not claimed

  const handleHoldToggle = () => {
    console.log('Hold toggle clicked:', {
      index,
      currentHold: milestone.heldByRecipient,
      canHold,
      onSetMilestoneHold: !!onSetMilestoneHold
    });

    if (!onSetMilestoneHold) {
      console.error('onSetMilestoneHold function is not provided');
      return;
    }

    try {
      // Toggle the hold state: if currently held, unhold it; if not held, hold it
      onSetMilestoneHold(index, !milestone.heldByRecipient);
    } catch (error) {
      console.error('Error in handleHoldToggle:', error);
    }
  };

  const handleClaim = () => {
    onClaimMilestone(index);
  };

  return (
    <tr className="border-b border-gray-600/50 hover:bg-gray-600/30">
      <td className="p-4 font-mono">#{index}</td>
      <td className="p-4">
        {(Number(milestone.percentBP) / 100).toFixed(0)}%
      </td>
      <td className="p-4 font-mono">
        {formatAmount(milestone.amount, manageTokenDecimals)}
        {agreement && agreement[4] === ZERO_ADDRESS ? ' ETH' : ` ${manageTokenSymbol}`}
      </td>
      <td className="p-4">
        {new Date(Number(milestone.unlockAt) * 1000).toLocaleString()}
      </td>
      <td className="p-4 font-mono text-sm">
        {countdown}
      </td>
      <td className="p-4">
        <div className="flex flex-col space-y-1">
          <span className={`inline-block px-2 py-1 rounded text-xs ${milestone.claimed ? 'bg-green-500/20 text-green-300' :
            isUnlocked && !milestone.heldByRecipient ? 'bg-blue-500/20 text-blue-300' :
              milestone.heldByRecipient ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-gray-500/20 text-gray-300'
            }`}>
            {milestone.claimed ? 'Claimed' :
              milestone.heldByRecipient ? 'Held' :
                isUnlocked ? 'Ready' : 'Locked'}
          </span>
        </div>
      </td>
      <td className="p-4">
        <div className="flex flex-col gap-2">
          {/* Claim Button for Service Provider */}
          {canClaim && (
            <button
              onClick={handleClaim}
              className="bg-teal-600 hover:bg-teal-700 rounded-lg px-3 py-1 text-sm disabled:opacity-50 transition-colors"
            >
              Claim
            </button>
          )}

          {/* Hold/Unhold Button for Service Recipient */}
          {canHold && (
            <button
              onClick={handleHoldToggle}
              className={`rounded-lg px-3 py-1 text-sm transition-colors ${milestone.heldByRecipient
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-amber-600 hover:bg-amber-700'
                }`}
            >
              {milestone.heldByRecipient ? 'Unhold' : 'Hold'}
            </button>
          )}

          {/* Claimed Status */}
          {milestone.claimed && (
            <span className="text-green-400 text-sm">✓ Claimed</span>
          )}

          {/* Held Status Message */}
          {milestone.heldByRecipient && isServiceProvider && (
            <span className="text-yellow-400 text-xs">Held by recipient</span>
          )}
        </div>
      </td>
    </tr>
  );
}