//  useEffect(() => {
//     const handleTransactionSuccess = async () => {
//       if (!txSuccess || !txHash || txHash === lastSyncedTxHash || isSyncing) {
//         return;
//       }

//       setIsSyncing(true);
//       setLastSyncedTxHash(txHash);
//       updateStep("success", "Escrow created successfully!");

//       try {
//         console.log("✅ Transaction confirmed on-chain:", txHash);

//         // SUCCESS MESSAGE ONLY - NO BACKEND UPDATE
//         setUiSuccess("✅ Escrow created successfully!");
//         toast.success("Escrow Created Successfully!", {
//           description: `Transaction confirmed. Both parties will receive Telegram notifications.`,
//         });

//         // Close modal and reset
//         setTimeout(() => {
//           setOpen(false);
//           resetForm();
//           setCreationStep("idle");
//           setCurrentStepMessage("");
//           loadEscrowAgreements();
//         }, 2000);
//       } catch (err: any) {
//         console.error("❌ Error handling success:", err);
//         updateStep("error", "Error finalizing escrow creation");
//         toast.error("Transaction Success", {
//           description:
//             "Escrow created on-chain but there was an issue updating UI.",
//         });
//       } finally {
//         setIsSyncing(false);
//         resetWrite();
//       }
//     };

//     handleTransactionSuccess();
//   }, [
//     txSuccess,
//     txHash,
//     lastSyncedTxHash,
//     isSyncing,
//     resetWrite,
//     loadEscrowAgreements,
//   ]);

//     useEffect(() => {
//       if (approvalSuccess) {
//         setUiSuccess("Token approval confirmed!");
//         toast.success("Token approval confirmed!");
//         resetApproval();
//       }
//     }, [approvalSuccess, resetApproval]);
