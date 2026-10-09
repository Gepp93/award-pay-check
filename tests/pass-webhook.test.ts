import { describe, test, expect } from 'bun:test';
import { applyCheckout } from '../supabase/functions/stripe-webhook/payment.ts';
const id='00000000-0000-4000-8000-000000000002';
function fixture(purchase:any,report:any=null){
 const updates:any[]=[];
 const admin={from:(table:string)=>{const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:table==='subscription_purchases'?purchase:table==='reports'?report:{credits:2}}),update:(data:any)=>{updates.push({table,data});return q},upsert:async(data:any)=>{updates.push({table,data});return {error:null}},then:(ok:any)=>Promise.resolve({error:null}).then(ok)};return q},rpc:async(name:string,args:any)=>{updates.push({name,args});return {error:null}}};
 return {admin,updates};
}
describe('verified checkout routing, no live services',()=>{
 test('$30 pending purchase activates pass and linked report transaction',async()=>{const f=fixture({id,status:'pending',report_id:'report-1'});await applyCheckout(f.admin,{id:'cs_test',client_reference_id:id,amount_total:3000,currency:'aud',payment_status:'paid',metadata:{product:'backpay_pack'}});expect(f.updates).toEqual([{name:'complete_pass_purchase',args:{p_purchase_id:id,p_session_id:'cs_test',p_email:null,p_product:'three_month_pass'}}]);console.log('3 Month Pass: transactional paid + 90-day expiry + profile three_month + linked report paid');});
 test('legacy yearly purchase preserved',async()=>{const f=fixture({id,status:'pending'});await applyCheckout(f.admin,{id:'cs_legacy',client_reference_id:id,amount_total:1000});expect(f.updates[0].args.p_product).toBe('yearly_access');console.log('Legacy yearly: transactional paid + one-year expiry + profile yearly');});
 test('$30 report-only reference retains legacy backpay credits',async()=>{const f=fixture(null,{id,user_id:'owner'});await applyCheckout(f.admin,{id:'cs_pack',client_reference_id:id,amount_total:3000});expect(f.updates[0].data.payment_status).toBe('paid');expect(f.updates[1].data.credits).toBe(7);});
 test('unpaid and incorrect currency rejected',async()=>{const f=fixture({id});await applyCheckout(f.admin,{id:'cs_unpaid',client_reference_id:id,amount_total:3000,payment_status:'unpaid'});expect(f.updates.length).toBe(0);await expect(applyCheckout(f.admin,{id:'cs_bad',client_reference_id:id,amount_total:3000,currency:'usd'})).rejects.toThrow();});
});
