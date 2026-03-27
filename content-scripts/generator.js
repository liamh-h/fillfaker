/**
 * FillFaker Data Generator
 * Generates consistent fake identity data — same person's name, email, address all match.
 */
class FakeDataGenerator {
  constructor() {
    this.data = window.FILLFAKER_DATA;
    this.currentIdentity = null;
  }

  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Luhn algorithm — generates a valid-format credit card number
   */
  generateCreditCard() {
    const prefixes = ['4532', '4716', '4929', '5425', '5178', '5368', '6011', '6221'];
    let num = this.pick(prefixes);
    for (let i = 0; i < 11; i++) {
      num += Math.floor(Math.random() * 10);
    }
    // Luhn check digit
    let sum = 0;
    let alternate = true;
    for (let i = num.length - 1; i >= 0; i--) {
      let n = parseInt(num[i], 10);
      if (alternate) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alternate = !alternate;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return num + checkDigit;
  }

  formatCreditCard(num) {
    return num.replace(/(.{4})/g, '$1-').slice(0, -1);
  }

  generatePassword() {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const special = '!@#$%&*';
    const all = lower + upper + digits + special;

    // Ensure at least one of each category
    let pass = '';
    pass += lower[Math.floor(Math.random() * lower.length)];
    pass += upper[Math.floor(Math.random() * upper.length)];
    pass += digits[Math.floor(Math.random() * digits.length)];
    pass += special[Math.floor(Math.random() * special.length)];

    for (let i = 4; i < 14; i++) {
      pass += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle
    return pass.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Generate a complete consistent identity
   */
  generateIdentity() {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const firstName = this.pick(this.data.firstNames[gender]);
    const lastName = this.pick(this.data.lastNames);
    const location = this.pick(this.data.cities);
    const streetNum = this.randInt(100, 9999);
    const street = this.pick(this.data.streets);
    const emailDomain = this.pick(this.data.emailDomains);
    const birthYear = this.randInt(1970, 2002);
    const birthMonth = this.randInt(1, 12);
    const birthDay = this.randInt(1, 28);
    const ccRaw = this.generateCreditCard();
    const expMonth = String(this.randInt(1, 12)).padStart(2, '0');
    const expYear = `${this.randInt(2026, 2032)}`;

    this.currentIdentity = {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${emailDomain}`,
      phone: `(${this.randInt(200, 999)}) ${this.randInt(200, 999)}-${this.randInt(1000, 9999)}`,
      address: `${streetNum} ${street}`,
      city: location.city,
      state: location.stateAbbr,
      stateFull: location.state,
      zip: `${location.zip}${String(this.randInt(0, 99)).padStart(2, '0')}`,
      country: 'United States',
      company: this.pick(this.data.companies),
      jobTitle: this.pick(this.data.jobTitles),
      website: `https://${firstName.toLowerCase()}${lastName.toLowerCase()}.dev`,
      username: `${firstName.toLowerCase()}_${lastName.charAt(0).toLowerCase()}_${this.randInt(100, 999)}`,
      password: this.generatePassword(),
      age: `${new Date().getFullYear() - birthYear}`,
      birthDate: `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`,
      birthDateUS: `${String(birthMonth).padStart(2, '0')}/${String(birthDay).padStart(2, '0')}/${birthYear}`,
      creditCard: this.formatCreditCard(ccRaw),
      creditCardRaw: ccRaw,
      cvv: `${this.randInt(100, 999)}`,
      expMonth,
      expYear,
      expDate: `${expMonth}/${expYear.slice(-2)}`,
      ssn: `${this.randInt(100, 665)}-${this.randInt(10, 99)}-${this.randInt(1000, 9999)}`,
      bio: this.pick(this.data.lorem),
      gender
    };

    return this.currentIdentity;
  }

  /**
   * Get value for a detected field type from the current identity
   */
  getValueForType(fieldType) {
    if (!this.currentIdentity) this.generateIdentity();
    const id = this.currentIdentity;

    const map = {
      'firstName': id.firstName,
      'lastName': id.lastName,
      'fullName': id.fullName,
      'email': id.email,
      'phone': id.phone,
      'address': id.address,
      'city': id.city,
      'state': id.state,
      'zip': id.zip,
      'country': id.country,
      'company': id.company,
      'jobTitle': id.jobTitle,
      'website': id.website,
      'username': id.username,
      'password': id.password,
      'age': id.age,
      'birthDate': id.birthDate,
      'creditCard': id.creditCard,
      'cvv': id.cvv,
      'expDate': id.expDate,
      'expMonth': id.expMonth,
      'expYear': id.expYear,
      'ssn': id.ssn,
      'bio': id.bio,
      'text': id.bio,
      'number': `${this.randInt(1, 1000)}`,
      'unknown': id.fullName
    };

    return map[fieldType] || id.fullName;
  }

  regenerate() {
    this.currentIdentity = null;
    return this.generateIdentity();
  }
}

window.FakeDataGenerator = FakeDataGenerator;
