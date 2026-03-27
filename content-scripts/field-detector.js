/**
 * FillFaker Field Detector
 * 8-signal analysis to identify form field types.
 * Signals: input type, autocomplete, name, id, class, placeholder, label text, aria-label
 */
class FieldDetector {

  // Field type rules — priority top to bottom
  static RULES = [
    { type: 'email',      patterns: [/e[\-_.]?mail/i], inputTypes: ['email'] },
    { type: 'password',   patterns: [/passw/i, /\bpwd\b/i], inputTypes: ['password'] },
    { type: 'phone',      patterns: [/phone/i, /\btel\b/i, /mobile/i, /cell/i, /fax/i], inputTypes: ['tel'] },
    { type: 'creditCard', patterns: [/card[\-_.]?num/i, /credit[\-_.]?card/i, /cc[\-_.]?num/i, /\bpan\b/i] },
    { type: 'cvv',        patterns: [/\bcvv\b/i, /\bcvc\b/i, /security[\-_.]?code/i, /card[\-_.]?code/i] },
    { type: 'expDate',    patterns: [/expir/i, /exp[\-_.]?date/i, /valid[\-_.]?thru/i] },
    { type: 'expMonth',   patterns: [/exp[\-_.]?month/i, /card[\-_.]?month/i] },
    { type: 'expYear',    patterns: [/exp[\-_.]?year/i, /card[\-_.]?year/i] },
    { type: 'ssn',        patterns: [/\bssn\b/i, /social[\-_.]?sec/i] },
    { type: 'firstName',  patterns: [/first[\-_.]?name/i, /\bfname\b/i, /given[\-_.]?name/i, /forename/i] },
    { type: 'lastName',   patterns: [/last[\-_.]?name/i, /\blname\b/i, /surname/i, /family[\-_.]?name/i] },
    { type: 'fullName',   patterns: [/full[\-_.]?name/i, /^name$/i, /your[\-_.]?name/i, /display[\-_.]?name/i] },
    { type: 'username',   patterns: [/user[\-_.]?name/i, /\blogin\b/i, /\baccount\b/i, /\bhandle\b/i] },
    { type: 'birthDate',  patterns: [/birth/i, /\bdob\b/i, /date[\-_.]?of[\-_.]?birth/i, /birthday/i] },
    { type: 'age',        patterns: [/\bage\b/i] },
    { type: 'company',    patterns: [/company/i, /\borg\b/i, /employer/i, /business[\-_.]?name/i, /organization/i] },
    { type: 'jobTitle',   patterns: [/job[\-_.]?title/i, /\btitle\b/i, /position/i, /\brole\b/i, /occupation/i] },
    { type: 'website',    patterns: [/website/i, /\burl\b/i, /homepage/i, /\bblog\b/i], inputTypes: ['url'] },
    { type: 'address',    patterns: [/address/i, /street/i, /\baddr\b/i, /line[\-_.]?1/i] },
    { type: 'city',       patterns: [/\bcity\b/i, /\btown\b/i, /locality/i] },
    { type: 'state',      patterns: [/\bstate\b/i, /province/i, /\bregion\b/i] },
    { type: 'zip',        patterns: [/\bzip\b/i, /postal/i, /postcode/i] },
    { type: 'country',    patterns: [/country/i, /\bnation\b/i] },
    { type: 'bio',        patterns: [/\bbio\b/i, /\babout\b/i, /description/i, /comment/i, /message/i, /\bnote\b/i] },
    { type: 'number',     patterns: [/\bnumber\b/i, /\bamount\b/i, /\bqty\b/i, /quantity/i], inputTypes: ['number'] }
  ];

  /**
   * Match a single signal string against all rules
   * @returns {string|null} matched type or null
   */
  static matchSignal(signal) {
    if (!signal) return null;
    for (const rule of this.RULES) {
      for (const pattern of rule.patterns) {
        if (pattern.test(signal)) return rule.type;
      }
    }
    return null;
  }

  /**
   * Detect a single field's type
   * @param {HTMLElement} field
   * @returns {string} field type key
   */
  static detect(field) {
    // Signal 1: input type attribute (highest priority)
    const inputType = field.type?.toLowerCase();
    for (const rule of this.RULES) {
      if (rule.inputTypes?.includes(inputType)) {
        return rule.type;
      }
    }

    // Signal 2: autocomplete standard values (high priority)
    const autocomplete = field.getAttribute('autocomplete');
    if (autocomplete) {
      const acMap = {
        'given-name': 'firstName', 'family-name': 'lastName', 'name': 'fullName',
        'email': 'email', 'tel': 'phone', 'tel-national': 'phone',
        'street-address': 'address', 'address-line1': 'address', 'address-line2': 'address',
        'address-level2': 'city', 'address-level1': 'state',
        'postal-code': 'zip', 'country-name': 'country', 'country': 'country',
        'organization': 'company', 'organization-title': 'jobTitle',
        'username': 'username', 'new-password': 'password', 'current-password': 'password',
        'cc-number': 'creditCard', 'cc-csc': 'cvv', 'cc-exp': 'expDate',
        'cc-exp-month': 'expMonth', 'cc-exp-year': 'expYear',
        'bday': 'birthDate', 'url': 'website'
      };
      if (acMap[autocomplete]) return acMap[autocomplete];
    }

    // Signal 3-7: test each signal INDEPENDENTLY to prevent cross-signal false positives
    // e.g. name="user" + id="age" won't wrongly match "age" rule
    const signalSources = [
      field.name,
      field.id,
      field.className,
      field.placeholder,
      field.getAttribute('aria-label')
    ].filter(Boolean);

    for (const signal of signalSources) {
      const match = this.matchSignal(signal);
      if (match) return match;
    }

    // Signal 8: associated <label> text
    let labelText = '';
    const root = field.getRootNode(); // works for both document and ShadowRoot
    if (field.id) {
      try {
        const label = root.querySelector(`label[for="${CSS.escape(field.id)}"]`);
        if (label) labelText = label.textContent || '';
      } catch (_) {}
    }
    if (!labelText) {
      const parentLabel = field.closest('label');
      if (parentLabel) labelText = parentLabel.textContent || '';
    }
    if (labelText) {
      const match = this.matchSignal(labelText);
      if (match) return match;
    }

    // Fallback: textarea → bio
    if (field.tagName === 'TEXTAREA') return 'bio';

    // Fallback: date input
    if (inputType === 'date' || inputType === 'datetime-local') return 'birthDate';

    return 'unknown';
  }

  /**
   * Scan all fillable fields within a root element.
   * Uses WeakSet to deduplicate across Shadow DOM boundaries.
   * @param {Element|ShadowRoot|Document} root
   * @param {WeakSet} [seen] - dedup set (internal)
   * @returns {Array<{element: HTMLElement, type: string}>}
   */
  static scanFields(root = document, seen = new WeakSet()) {
    const fields = [];
    const selectors = 'input, select, textarea, [contenteditable="true"]';
    const inputs = root.querySelectorAll(selectors);

    for (const el of inputs) {
      // Deduplicate (slot projections can cause elements to appear in both host and shadow)
      if (seen.has(el)) continue;
      seen.add(el);

      // contenteditable
      if (el.getAttribute('contenteditable') === 'true') {
        fields.push({ element: el, type: 'bio' });
        continue;
      }

      // Skip non-fillable types
      const skipTypes = ['hidden', 'submit', 'button', 'reset', 'image', 'file'];
      if (skipTypes.includes(el.type)) continue;
      if (el.disabled || el.readOnly) continue;

      // Skip invisible elements
      try {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' ||
            style.opacity === '0' || (el.offsetWidth === 0 && el.offsetHeight === 0)) continue;
      } catch (e) {
        continue;
      }

      const type = this.detect(el);
      fields.push({ element: el, type });
    }

    // Traverse Shadow DOM
    const allElements = root.querySelectorAll('*');
    for (const el of allElements) {
      if (el.shadowRoot) {
        const shadowFields = this.scanFields(el.shadowRoot, seen);
        fields.push(...shadowFields);
      }
    }

    return fields;
  }
}

window.FieldDetector = FieldDetector;
