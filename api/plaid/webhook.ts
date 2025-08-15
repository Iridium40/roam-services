import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const webhookData = await req.json();
    
    console.log('Plaid webhook received:', webhookData);

    // Handle different webhook types
    switch (webhookData.webhook_type) {
      case 'ITEM':
        await handleItemWebhook(webhookData);
        break;
      case 'AUTH':
        await handleAuthWebhook(webhookData);
        break;
      case 'TRANSACTIONS':
        await handleTransactionsWebhook(webhookData);
        break;
      default:
        console.log(`Unhandled webhook type: ${webhookData.webhook_type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing Plaid webhook:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleItemWebhook(webhookData: any) {
  const { item_id, webhook_code, error } = webhookData;
  
  console.log(`Item webhook: ${webhook_code} for item ${item_id}`);
  
  try {
    // Update the item status in database
    const { error: updateError } = await supabase
      .from('provider_bank_accounts')
      .update({
        webhook_status: webhook_code,
        last_webhook_at: new Date().toISOString(),
        webhook_error: error || null,
        updated_at: new Date().toISOString()
      })
      .eq('plaid_item_id', item_id);

    if (updateError) {
      console.error('Error updating item webhook status:', updateError);
    }

    // Handle specific item events
    switch (webhook_code) {
      case 'ERROR':
        console.error(`Plaid item error for ${item_id}:`, error);
        // You might want to notify the user or disable the connection
        break;
      case 'PENDING_EXPIRATION':
        console.log(`Plaid item ${item_id} is pending expiration`);
        // You might want to notify the user to re-authenticate
        break;
      case 'USER_PERMISSION_REVOKED':
        console.log(`User revoked permissions for item ${item_id}`);
        // You might want to disable the connection
        break;
    }
  } catch (error) {
    console.error('Error handling item webhook:', error);
  }
}

async function handleAuthWebhook(webhookData: any) {
  const { item_id, webhook_code } = webhookData;
  
  console.log(`Auth webhook: ${webhook_code} for item ${item_id}`);
  
  // Handle auth-specific events
  switch (webhook_code) {
    case 'AUTOMATICALLY_VERIFIED':
      console.log(`Auth automatically verified for item ${item_id}`);
      break;
    case 'VERIFICATION_EXPIRED':
      console.log(`Auth verification expired for item ${item_id}`);
      break;
  }
}

async function handleTransactionsWebhook(webhookData: any) {
  const { item_id, webhook_code, new_transactions, removed_transactions } = webhookData;
  
  console.log(`Transactions webhook: ${webhook_code} for item ${item_id}`);
  
  // Handle transaction events
  switch (webhook_code) {
    case 'INITIAL_UPDATE':
    case 'HISTORICAL_UPDATE':
    case 'DEFAULT_UPDATE':
      console.log(`Transaction update for item ${item_id}: ${new_transactions} new, ${removed_transactions} removed`);
      // You might want to fetch and store the new transactions
      break;
    case 'TRANSACTIONS_REMOVED':
      console.log(`Transactions removed for item ${item_id}: ${removed_transactions}`);
      // You might want to remove the transactions from your database
      break;
  }
}

export const config = {
  runtime: 'edge',
};
