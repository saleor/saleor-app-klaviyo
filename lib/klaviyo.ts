interface EmailServiceProvider {
  send: (event: string, recipient: string, context: any) => void;
}

const Klaviyo = (token: string): EmailServiceProvider => ({
  send: async (event, recipient, context) => {
    const formParams = new URLSearchParams();
    formParams.append(
      "data",
      JSON.stringify({
        token,
        event,
        customer_properties: { $email: recipient },
        properties: context,
      })
    );

    console.log(
      "Klaviyo request: https://a.klaviyo.com/api/track, ",
      formParams
    );

    const response = await fetch("https://a.klaviyo.com/api/track", {
      method: "POST",
      body: formParams,
    });

    console.log(
      "Klaviyo response: ",
      response.status,
      ", ",
      await response.text()
    );
  },
});

export default Klaviyo;
