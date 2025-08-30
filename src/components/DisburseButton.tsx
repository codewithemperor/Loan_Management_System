"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import Swal from "sweetalert2";

interface DisburseButtonProps {
  applicationId: string;
}

export default function DisburseButton({ applicationId }: DisburseButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDisburse = async () => {
    // Show confirmation dialog first
    const result = await Swal.fire({
      title: 'Confirm Disbursement',
      text: 'Are you sure you want to disburse this loan? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Disburse',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/applications/${applicationId}/disburse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Success alert
        await Swal.fire({
          title: 'Success!',
          text: data.message || 'Loan disbursed successfully',
          icon: 'success',
          confirmButtonColor: '#16a34a',
          confirmButtonText: 'OK'
        });

        // Refresh the page to show updated status
        window.location.reload();
      } else {
        // Error alert
        await Swal.fire({
          title: 'Error!',
          text: data.error || 'Failed to disburse loan',
          icon: 'error',
          confirmButtonColor: '#ef4444',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error disbursing loan:', error);
      
      // Network/unexpected error alert
      await Swal.fire({
        title: 'Error!',
        text: 'An unexpected error occurred. Please try again.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      size="sm" 
      className="bg-green-600 hover:bg-green-700"
      onClick={handleDisburse}
      disabled={isLoading}
    >
      {isLoading ? 'Processing...' : 'Disburse Loan'}
    </Button>
  );
}