const SUPABASE_URL = 'https://jofpwwcoxpkphgdyvole.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvZnB3d2NveHBrcGhnZHl2b2xlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyODA4OTYsImV4cCI6MjA5Mzg1Njg5Nn0.kzgJYNA2jIhZHxZ5OTr1GL7_3RZkj1-B3ijM2XXrVH0';
const TOSS_CLIENT_KEY = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
const CONFIRM_PAYMENT_URL = `${SUPABASE_URL}/functions/v1/confirm-payment`;

window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getSession() {
  const { data: { session } } = await window.supabase.auth.getSession();
  return session;
}

async function requireAuth() {
  const session = await getSession();
  if (!session) { location.href = 'auth.html'; return null; }
  return session;
}

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.user.app_metadata?.role !== 'admin') {
    location.href = 'index.html';
    return null;
  }
  return session;
}

async function signOut() {
  await window.supabase.auth.signOut();
  location.href = 'index.html';
}

function formatPrice(won) {
  return '₩' + Number(won).toLocaleString('ko-KR');
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function statusBadge(status) {
  const map = {
    pending:   ['badge-warning', '결제 대기'],
    paid:      ['badge-success', '결제 완료'],
    failed:    ['badge-danger',  '결제 실패'],
    cancelled: ['badge-neutral', '취소됨'],
  };
  const [cls, label] = map[status] ?? ['badge-neutral', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

async function updateNav() {
  const session = await getSession();
  const navRight = document.getElementById('nav-right');
  if (!navRight) return;
  if (session) {
    const isAdmin = session.user.app_metadata?.role === 'admin';
    navRight.innerHTML = `
      ${isAdmin ? '<a href="admin.html" class="nav-link">관리자</a>' : ''}
      <a href="orders.html" class="nav-link">내 주문</a>
      <button onclick="signOut()" class="btn btn-sm btn-outline">로그아웃</button>
    `;
  } else {
    navRight.innerHTML = `<a href="auth.html" class="btn btn-sm btn-primary">로그인</a>`;
  }
}
