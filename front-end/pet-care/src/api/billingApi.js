const BASE_URL = 'https://pet-management-ro9c.onrender.com/billing';

const buildHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export async function getUserBilling() {
  try {
    const response = await fetch(`${BASE_URL}/user`, {
      method: 'GET',
      headers: buildHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, bills: [], message: data.message || 'Failed to fetch billing records' };
    }

    return { success: true, bills: data.bills || [] };
  } catch (error) {
    console.error('Fetch billing error:', error);
    return { success: false, bills: [], message: 'Something went wrong while fetching billing records' };
  }
}

export async function payBilling(billingId, payment_reference = '') {
  try {
    const response = await fetch(`${BASE_URL}/${billingId}/pay`, {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify({ payment_reference }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.message || 'Failed to record payment' };
    }

    return { success: true, message: data.message || 'Payment recorded' };
  } catch (error) {
    console.error('Pay billing error:', error);
    return { success: false, message: 'Something went wrong while recording payment' };
  }
}
export async function adminPayBilling(billingId, payment_reference = '') {
  try {
    const response = await fetch(`${BASE_URL}/admin/${billingId}/pay`, {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify({ payment_reference }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.message || 'Failed to record payment' };
    }

    return { success: true, message: data.message || 'Payment recorded' };
  } catch (error) {
    console.error('Admin pay billing error:', error);
    return { success: false, message: 'Something went wrong while recording payment' };
  }
}

export async function getAllBilling() {
  try {
    const response = await fetch(`${BASE_URL}/all`, {
      method: 'GET',
      headers: buildHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, bills: [], message: data.message || 'Failed to fetch billing records' };
    }

    return { success: true, bills: data.bills || [] };
  } catch (error) {
    console.error('Fetch all billing error:', error);
    return { success: false, bills: [], message: 'Something went wrong while fetching billing records' };
  }
}

