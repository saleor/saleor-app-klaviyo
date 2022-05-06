interface EmailServiceProvider {
  send: (event: string, recipient: string, context: any) => void;
}

const Klaviyo = (token: string): EmailServiceProvider => ({
  send: async (event, recipient, context) => {
    const formParams = new URLSearchParams();
    formParams.append("data", JSON.stringify({
      token,
      event,
      customer_properties: { $email: recipient },
      properties: context,
    }));

    await fetch("https://a.klaviyo.com/api/track", { method: "POST", body: formParams });
  },
});

export default Klaviyo;
