/**
 * StudentSphere Client-side UI Enhancements
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Auto-dismiss flash notifications after 5 seconds
  const alerts = document.querySelectorAll('.alert-success, .alert-info');
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.5s ease';
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 500);
    }, 5000);
  });

  // 2. Real-time fast table filtering (instant keyboard search)
  const quickSearchInput = document.getElementById('search');
  const table = document.querySelector('.data-table tbody');
  
  if (quickSearchInput && table) {
    quickSearchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      const rows = table.querySelectorAll('tr');

      rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        if (!term || text.includes(term)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  }

  // 3. Highlight invalid fields upon initial render
  const firstInvalidInput = document.querySelector('.form-control.is-invalid');
  if (firstInvalidInput) {
    firstInvalidInput.focus();
  }
});
