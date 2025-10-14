export type DisputeRow = {
  id: string;
  createdAt: string; // ISO
  title: string;
  request: "Pro Bono" | "Paid";
  parties: string;
  status: "Pending" | "Vote in Progress" | "Settled" | "Dismissed";
};

// Mock data
const disputesData: DisputeRow[] = [
  {
    id: "D-311",
    createdAt: "2025-10-30",
    title: "Payment dispute for audit",
    request: "Paid",
    parties: "@0xAlfa vs @0xBeta",
    status: "Vote in Progress",
  },
  {
    id: "D-309",
    createdAt: "2025-10-28",
    title: "Missed delivery window",
    request: "Pro Bono",
    parties: "@0xAstra vs @0xNova",
    status: "Pending",
  },
  {
    id: "D-300",
    createdAt: "2025-10-14",
    title: "IP infringement claim",
    request: "Paid",
    parties: "@0xOrion vs @0xEcho",
    status: "Settled",
  },
  {
    id: "D-296",
    createdAt: "2025-10-09",
    title: "Unresponsive contractor",
    request: "Pro Bono",
    parties: "@0xZen vs @0xVolt",
    status: "Dismissed",
  },
];

// 🧩 Fetch all disputes
export function getDisputes(): Promise<DisputeRow[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(disputesData), 500); // simulate API delay
  });
}

// 🧩 Fetch single dispute by ID
export function getDisputeById(id: string): Promise<DisputeRow | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const dispute = disputesData.find((d) => d.id === id);
      resolve(dispute);
    }, 400); // slightly faster delay
  });
}
