const fs = require('fs');
const path = require('path');

function patch(rel, apply) {
  const file = path.join(__dirname, '..', rel);
  const raw = fs.readFileSync(file, 'utf8');
  const hadCrlf = raw.includes('\r\n');
  let t = raw.replace(/\r\n/g, '\n');
  t = apply(t);
  fs.writeFileSync(file, hadCrlf ? t.replace(/\n/g, '\r\n') : t);
  console.log('OK', rel);
}

patch('src/context/CartContext.tsx', (t) => {
  const old = '                    isGift: item.is_gift,';
  const neu = '                    isGift: !!(item.is_gift || (enrichedCustomization as any)?.is_gift),';
  if (!t.includes(old)) {
    if (t.includes('enrichedCustomization as any)?.is_gift')) console.log('already');
    else throw new Error('isGift line missing');
  } else t = t.replace(old, neu);
  return t;
});

patch('src/services/campaignsService.ts', (t) => {
  const old = `      if (activeOnly) {
        filteredCampaigns = campaigns.filter((campaign) => {
          const isActive = campaign.is_active === true;
          if (import.meta.env.DEV && !isActive) {
            console.log(\`   ❌ Campaign "\${campaign.name}" (id: \${campaign.id}) filtered out - is_active: \${campaign.is_active}\`);
          }
          return isActive;
        });
        
        if (import.meta.env.DEV) {
          console.log(\`🔍 Active filter: \${campaigns.length} → \${filteredCampaigns.length} campaigns (filtered by is_active flag only)\`);
        }
      }`;

  const neu = `      if (activeOnly) {
        const now = Date.now();
        filteredCampaigns = campaigns.filter((campaign) => {
          if (campaign.is_active !== true) {
            if (import.meta.env.DEV) {
              console.log(\`   ❌ Campaign "\${campaign.name}" (id: \${campaign.id}) filtered out - is_active: \${campaign.is_active}\`);
            }
            return false;
          }
          const start = (campaign as any).starts_at || (campaign as any).start_date || (campaign as any).valid_from;
          const end = (campaign as any).ends_at || (campaign as any).end_date || (campaign as any).valid_until;
          if (start && new Date(start).getTime() > now) return false;
          if (end && new Date(end).getTime() < now) return false;
          return true;
        });
        
        if (import.meta.env.DEV) {
          console.log(\`🔍 Active filter: \${campaigns.length} → \${filteredCampaigns.length} campaigns (is_active + date window)\`);
        }
      }`;

  if (!t.includes(old)) {
    if (t.includes('is_active + date window')) console.log('campaign already');
    else throw new Error('campaign filter missing');
  } else t = t.replace(old, neu);
  return t;
});
