async function loadPayments() {
    try {
        const response = await api.get('/api/payments');
        const payments = response.data || [];

        const paymentsTable = document.getElementById('paymentsTable');
        paymentsTable.innerHTML = '';

        payments.forEach(payment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(payment.date).toLocaleDateString()}</td>
                <td>${payment.service}</td>
                <td>$${payment.amount.toFixed(2)}</td>
                <td>
                    <span class="badge ${payment.status === 'completed' ? 'bg-success' : 'bg-warning'}">
                        ${payment.status}
                    </span>
                </td>
                <td>
                    ${payment.status === 'pending' ? 
                        `<button class="btn btn-sm btn-primary" onclick="makePayment('${payment.id}')">Pay Now</button>` : 
                        `<button class="btn btn-sm btn-secondary" onclick="viewReceipt('${payment.id}')">View Receipt</button>`
                    }
                </td>
            `;
            paymentsTable.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading payments:', error);
        alert('Failed to load payment history');
    }
}

document.getElementById('paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const appointmentId = document.getElementById('appointmentId').value;
    const amount = document.getElementById('amount').value;
    const paymentMethod = document.getElementById('paymentMethod').value;

    try {
        const response = await api.post('/api/payments', {
            appointmentId,
            amount,
            paymentMethod
        });

        if (response.success) {
            alert('Payment successful!');
            loadPayments();
            document.getElementById('paymentForm').reset();
        } else {
            alert(response.message || 'Payment failed');
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('Payment failed. Please try again.');
    }
});

async function viewReceipt(paymentId) {
    try {
        const response = await api.get(`/api/payments/${paymentId}/receipt`);
        window.open(response.data.receiptUrl, '_blank');
    } catch (error) {
        console.error('Error viewing receipt:', error);
        alert('Failed to view receipt');
    }
}

async function makePayment(paymentId) {
    try {
        const response = await api.post(`/api/payments/${paymentId}/process`);
        if (response.success) {
            alert('Payment processed successfully!');
            loadPayments();
        } else {
            alert(response.message || 'Payment processing failed');
        }
    } catch (error) {
        console.error('Payment processing error:', error);
        alert('Payment processing failed. Please try again.');
    }
}

document.addEventListener('DOMContentLoaded', loadPayments); 