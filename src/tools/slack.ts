export async function sendToSlack(message: string): Promise<boolean> {
    if (!process.env.SLACK_WEBHOOK_URL) return false;

    try {
        const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "MY_SECRET_KEY": message
            })
        });

        if (!response.ok) {
            console.error(`Failed to send to Slack: ${response.status} ${response.statusText}`);
            return false;
        }
        console.log('Successfully sent documentation to Slack');
        return true;
    } catch (error) {
        console.error('Error sending to Slack:', error);
        return false;
    }
}
