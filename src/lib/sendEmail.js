export const sendEmail = async (emailData) => {
    const res = await fetch('/api/sendEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });
  
    return res.json();
  };
  