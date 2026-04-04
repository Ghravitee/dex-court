export const AgreementSkeleton = () => (
  <tr className="animate-pulse border-t border-white/10">
    {[20, 40, 32, 24, 16, 16].map((w, i) => (
      <td key={i} className="px-5 py-4">
        <div className={`h-4 w-${w} rounded bg-white/10`} />
      </td>
    ))}
  </tr>
);
