export const ACCOUNTS = ['muku_sns', 'mukuax'];
export function checkedAccount(account = 'muku_sns') {
  if (!ACCOUNTS.includes(account)) throw Error('Unsupported account');
  return account;
}
export const reportAccount = report => report.account ?? 'muku_sns';
export const forAccount = (reports, account, kind) => reports.filter(r => reportAccount(r) === checkedAccount(account) && r.kind === kind);
