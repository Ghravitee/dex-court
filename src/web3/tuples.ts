// src/web3/tuples.ts
export type RawVotingConfigArray = [
    tier1ThresholdPercent?: bigint | number | string,
    tier2ThresholdPercent?: bigint | number | string,
    divisor?: bigint | number | string,
    tier1Weight?: bigint | number | string,
    tier2Weight?: bigint | number | string,
    judgeWeight?: bigint | number | string,
    votingDuration?: bigint | number | string,
];

export type RawDisputeStatsArray = [
    id?: bigint | number | string,
    active?: boolean | number,
    createdAt?: bigint | number | string,
    endTime?: bigint | number | string,
    finalized?: boolean | number,
    plaintiffWins?: boolean | number,
    defendantWins?: boolean | number,
    dismissed?: boolean | number,
];

export type RawAgreementArray = [
    _id?: bigint | number | string,
    creator?: string,
    serviceProvider?: string,
    serviceRecipient?: string,
    token?: string,
    amount?: bigint | number | string,
    remainingAmount?: bigint | number | string,
    createdAt?: bigint | number | string,
    deadline?: bigint | number | string,
    deadlineDuration?: bigint | number | string,
    grace1Ends?: bigint | number | string,
    grace2Ends?: bigint | number | string,
    grace1EndsCalledBy?: string,
    grace2EndsCalledBy?: string,
    funded?: boolean | number,
    signed?: boolean | number,
    acceptedByServiceProvider?: boolean | number,
    acceptedByServiceRecipient?: boolean | number,
    completed?: boolean | number,
    disputed?: boolean | number,
    privateMode?: boolean | number,
    frozen?: boolean | number,
    pendingCancellation?: boolean | number,
    orderCancelled?: boolean | number,
    vesting?: boolean | number,
    deliverySubmited?: boolean | number,
    votingId?: bigint | number | string,
    voteStartedAt?: bigint | number | string,
    plaintiff?: string,
    defendant?: string,
];

export type RawCreatorsArray = [
    creator?: string,
];

