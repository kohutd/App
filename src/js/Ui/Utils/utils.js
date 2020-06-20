/*
 * Copyright 2020 Telegram V authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

/**
    returns Lowercase OS name
**/

export function isDateEqual(one, two) {
    if (!isValidDate(one) || !isValidDate(two)) return false;
    return one.getDate() === two.getDate() &&
        one.getMonth() === two.getMonth() &&
        one.getFullYear() === two.getFullYear()
}

export function isValidDate(d) {
  return d instanceof Date && !isNaN(d);
}

export function isBullshitBrowser() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

export function isMobile() {
    return window.innerWidth < 991.98 // MAGIC NUMBER DO NOT CHANGE OR THE WORLD WILL COLLAPSE
}

export function isDesktop() {
    return !isMobile()
}

export function getOS() {
    var userAgent = window.navigator.userAgent,
        platform = window.navigator.platform,
        macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
        windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
        iosPlatforms = ['iPhone', 'iPad', 'iPod'],
        os = null;

    if (macosPlatforms.indexOf(platform) !== -1) {
        os = 'mac';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = 'ios';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = 'windows';
    } else if (/Android/.test(userAgent)) {
        os = 'android';
    } else if (!os && /Linux/.test(platform)) {
        os = 'linux';
    }

    return os;
}

export function askForFile(accept, callback, asBuffer = false, multiple = false) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple
    input.style.visibility="hidden";
    document.body.append(input);
    input.addEventListener("change", e => {
        Array.from(e.target.files).forEach(file => {
            var reader = new FileReader();
            if (asBuffer) {
                reader.readAsArrayBuffer(file)
            } else {
                reader.readAsDataURL(file);
            }

            reader.onload = readerEvent => {
                input.remove()

                callback(reader.result, file);
            }
        })
    })
    input.click();
    //input.remove(); //Safari
}

export function formatAudioTime(time) {
    if (!time) return "0:00";
    time = Math.floor(time);
    let hours = Math.floor(time / 3600)
    let minutes = Math.floor(time / 60) % 60
    let seconds = time % 60

    let formatted = [hours, minutes, seconds]
        .map(v => v < 10 ? "0" + v : v)
        .filter((v, i) => v !== "00" || i > 0)
        .join(":");
    if (formatted.startsWith("0")) formatted = formatted.substr(1);
    return formatted;
}

export function convertBits(array, fromBits, toBits) {
    let buf = "";
    let arr = [];

    for (var i of array) {
        var n = (i >>> 0).toString(2).substr(-fromBits);
        n = "0".repeat(fromBits).substr(n.length) + n;
        buf += n;
        while (buf.length >= toBits) {
            arr.push(parseInt(buf.substr(0, toBits), 2));
            buf = buf.substr(toBits);
        }
    }
    return arr;
}

export const countries = [
    ["+93", "Afghanistan", "AF", "🇦🇫"],
    ["+358 18", "Åland Islands", "AX", "🇦🇽"],
    ["+355", "Albania", "AL", "🇦🇱"],
    ["+213", "Algeria", "DZ", "🇩🇿"],
    ["+1 684", "American Samoa", "AS", "🇦🇸"],
    ["+376", "Andorra", "AD", "🇦🇩"],
    ["+244", "Angola", "AO", "🇦🇴"],
    ["+1 264", "Anguilla", "AI", "🇦🇮"],
    ["+1 268", "Antigua & Barbuda", "AG", "🇦🇬"],
    ["+54", "Argentina", "AR", "🇦🇷"],
    ["+374", "Armenia", "AM", "🇦🇲"],
    ["+297", "Aruba", "AW", "🇦🇼"],
    ["+247", "Ascension", "SH", "🇸🇭"],
    ["+61", "Australia", "AU", "🇦🇺"],
    ["+672", "Australian External Territories", "AU", "🇦🇺"],
    ["+43", "Austria", "AT", "🇦🇹"],
    ["+994", "Azerbaijan", "AZ", "🇦🇿"],
    ["+1 242", "Bahamas", "BS", "🇧🇸"],
    ["+973", "Bahrain", "BH", "🇧🇭"],
    ["+880", "Bangladesh", "BD", "🇧🇩"],
    ["+1 246", "Barbados", "BB", "🇧🇧"],
    ["+1 268", "Barbuda", "AG", "🇦🇬"],
    ["+375", "Belarus", "BY", "🇧🇾"],
    ["+32", "Belgium", "BE", "🇧🇪"],
    ["+501", "Belize", "BZ", "🇧🇿"],
    ["+229", "Benin", "BJ", "🇧🇯"],
    ["+1 441", "Bermuda", "BM", "🇧🇲"],
    ["+975", "Bhutan", "BT", "🇧🇹"],
    ["+591", "Bolivia", "BO", "🇧🇴"],
    ["+599 7", "Caribbean Netherlands", "BQ", "🇧🇶"],
    ["+387", "Bosnia & Herzegovina", "BA", "🇧🇦"],
    ["+267", "Botswana", "BW", "🇧🇼"],
    ["+55", "Brazil", "BR", "🇧🇷"],
    ["+246", "British Indian Ocean Territory", "IO", "🇮🇴"],
    ["+1 284", "British Virgin Islands", "VG", "🇻🇬"],
    ["+673", "Brunei", "BN", "🇧🇳"],
    ["+359", "Bulgaria", "BG", "🇧🇬"],
    ["+226", "Burkina Faso", "BF", "🇧🇫"],
    ["+95", "Myanmar (Burma)", "MY", "🇲🇾"],
    ["+257", "Burundi", "BI", "🇧🇮"],
    ["+855", "Cambodia", "KH", "🇰🇭"],
    ["+237", "Cameroon", "CM", "🇨🇲"],
    ["+1", "Canada", "CA", "🇨🇦"],
    ["+238", "Cape Verde", "CV", "🇨🇻"],
    ["+1 345", "Cayman Islands", "KY", "🇰🇾"],
    ["+236", "Central African Republic", "CF", "🇨🇫"],
    ["+235", "Chad", "TD", "🇹🇩"],
    ["+56", "Chile", "CL", "🇨🇱"],
    ["+86", "China", "CN", "🇨🇳"],
    ["+61", "Christmas Island", "CX", "🇨🇽"],
    ["+61", "Cocos (Keeling) Islands", "CC", "🇨🇨"],
    ["+57", "Colombia", "CO", "🇨🇴"],
    ["+269", "Comoros", "KM", "🇰🇲"],
    ["+242", "Congo - Brazzaville", "CG", "🇨🇬"],
    ["+243", "Congo - Kinshasa", "CD", "🇨🇩"],
    ["+682", "Cook Islands", "CK", "🇨🇰"],
    ["+506", "Costa Rica", "CR", "🇨🇷"],
    ["+225", "Côte d’Ivoire", "CI", "🇨🇮"],
    ["+385", "Croatia", "HR", "🇭🇷"],
    ["+53", "Cuba", "CU", "🇨🇺"],
    ["+599 9", "Curaçao", "CW", "🇨🇼"],
    ["+357", "Cyprus", "CY", "🇨🇾"],
    ["+420", "Czech Republic", "CZ", "🇨🇿"],
    ["+45", "Denmark", "DK", "🇩🇰"],
    ["+246", "Diego Garcia", "DG", "🇩🇬"],
    ["+253", "Djibouti", "DJ", "🇩🇯"],
    ["+1 767", "Dominica", "DM", "🇩🇲"],
    ["+1 809", "Dominican Republic", "DO", "🇩🇴"],
    ["+1 829", "Dominican Republic", "DO", "🇩🇴"],
    ["+1 849", "Dominican Republic", "DO", "🇩🇴"],
    ["+670", "Timor-Leste", "TL", "🇹🇱"],
    ["+593", "Ecuador", "EC", "🇪🇨"],
    ["+20", "Egypt", "EG", "🇪🇬"],
    ["+503", "El Salvador", "SV", "🇸🇻"],
    ["+240", "Equatorial Guinea", "GQ", "🇬🇶"],
    ["+291", "Eritrea", "ER", "🇪🇷"],
    ["+372", "Estonia", "EE", "🇪🇪"],
    ["+251", "Ethiopia", "ET", "🇪🇹"],
    ["+500", "Falkland Islands", "FK", "🇫🇰"],
    ["+298", "Faroe Islands", "FO", "🇫🇴"],
    ["+679", "Fiji", "FJ", "🇫🇯"],
    ["+358", "Finland", "FI", "🇫🇮"],
    ["+33", "France", "FR", "🇫🇷"],
    ["+594", "French Guiana", "GF", "🇬🇫"],
    ["+689", "French Polynesia", "PF", "🇵🇫"],
    ["+241", "Gabon", "GA", "🇬🇦"],
    ["+220", "Gambia", "GM", "🇬🇲"],
    ["+995", "Georgia", "GE", "🇬🇪"],
    ["+49", "Germany", "DE", "🇩🇪"],
    ["+233", "Ghana", "GH", "🇬🇭"],
    ["+350", "Gibraltar", "GI", "🇬🇮"],
    ["+30", "Greece", "GR", "🇬🇷"],
    ["+299", "Greenland", "GL", "🇬🇱"],
    ["+1 473", "Grenada", "GD", "🇬🇩"],
    ["+590", "Guadeloupe", "GP", "🇬🇵"],
    ["+1 671", "Guam", "GU", "🇬🇺"],
    ["+502", "Guatemala", "GT", "🇬🇹"],
    ["+44", "Guernsey", "GG", "🇬🇬"],
    ["+224", "Guinea", "GN", "🇬🇳"],
    ["+245", "Guinea-Bissau", "GW", "🇬🇼"],
    ["+592", "Guyana", "GY", "🇬🇾"],
    ["+509", "Haiti", "HT", "🇭🇹"],
    ["+504", "Honduras", "HN", "🇭🇳"],
    ["+852", "Hong Kong SAR China", "HK", "🇭🇰"],
    ["+36", "Hungary", "HU", "🇭🇺"],
    ["+354", "Iceland", "IS", "🇮🇸"],
    ["+91", "India", "IN", "🇮🇳"],
    ["+62", "Indonesia", "ID", "🇮🇩"],
    ["+98", "Iran", "IR", "🇮🇷"],
    ["+964", "Iraq", "IQ", "🇮🇶"],
    ["+353", "Ireland", "IE", "🇮🇪"],
    ["+972", "Israel", "IL", "🇮🇱"],
    ["+39", "Italy", "IT", "🇮🇹"],
    ["+1 876", "Jamaica", "JM", "🇯🇲"],
    ["+47 79", "Svalbard & Jan Mayen", "SJ", "🇸🇯"],
    ["+81", "Japan", "JP", "🇯🇵"],
    ["+44", "Jersey", "JE", "🇯🇪"],
    ["+962", "Jordan", "JO", "🇯🇴"],
    ["+7 7", "Kazakhstan", "KZ", "🇰🇿"],
    ["+254", "Kenya", "KE", "🇰🇪"],
    ["+686", "Kiribati", "KI", "🇰🇮"],
    ["+850", "North Korea", "KP", "🇰🇵"],
    ["+82", "South Korea", "KR", "🇰🇷"],
    ["+965", "Kuwait", "KW", "🇰🇼"],
    ["+996", "Kyrgyzstan", "KG", "🇰🇬"],
    ["+856", "Laos", "LA", "🇱🇦"],
    ["+371", "Latvia", "LV", "🇱🇻"],
    ["+961", "Lebanon", "LB", "🇱🇧"],
    ["+266", "Lesotho", "LS", "🇱🇸"],
    ["+231", "Liberia", "LR", "🇱🇷"],
    ["+218", "Libya", "LY", "🇱🇾"],
    ["+423", "Liechtenstein", "LI", "🇱🇮"],
    ["+370", "Lithuania", "LT", "🇱🇹"],
    ["+352", "Luxembourg", "LU", "🇱🇺"],
    ["+853", "Macau SAR China", "MO", "🇲🇴"],
    ["+389", "Macedonia", "MK", "🇲🇰"],
    ["+261", "Madagascar", "MG", "🇲🇬"],
    ["+265", "Malawi", "MW", "🇲🇼"],
    ["+60", "Malaysia", "MY", "🇲🇾"],
    ["+960", "Maldives", "MV", "🇲🇻"],
    ["+223", "Mali", "ML", "🇲🇱"],
    ["+356", "Malta", "MT", "🇲🇹"],
    ["+692", "Marshall Islands", "MH", "🇲🇭"],
    ["+596", "Martinique", "MQ", "🇲🇶"],
    ["+222", "Mauritania", "MR", "🇲🇷"],
    ["+230", "Mauritius", "MU", "🇲🇺"],
    ["+262", "Mayotte", "YT", "🇾🇹"],
    ["+52", "Mexico", "MX", "🇲🇽"],
    ["+691", "Micronesia", "FM", "🇫🇲"],
    ["+373", "Moldova", "MD", "🇲🇩"],
    ["+377", "Monaco", "MC", "🇲🇨"],
    ["+976", "Mongolia", "MN", "🇲🇳"],
    ["+382", "Montenegro", "ME", "🇲🇪"],
    ["+1 664", "Montserrat", "MS", "🇲🇸"],
    ["+212", "Morocco", "MA", "🇲🇦"],
    ["+258", "Mozambique", "MZ", "🇲🇿"],
    ["+264", "Namibia", "NA", "🇳🇦"],
    ["+674", "Nauru", "NR", "🇳🇷"],
    ["+977", "Nepal", "NP", "🇳🇵"],
    ["+31", "Netherlands", "NL", "🇳🇱"],
    ["+687", "New Caledonia", "NC", "🇳🇨"],
    ["+64", "New Zealand", "NZ", "🇳🇿"],
    ["+505", "Nicaragua", "NI", "🇳🇮"],
    ["+227", "Niger", "NE", "🇳🇪"],
    ["+234", "Nigeria", "NG", "🇳🇬"],
    ["+683", "Niue", "NU", "🇳🇺"],
    ["+672", "Norfolk Island", "NF", "🇳🇫"],
    ["+1 670", "Northern Mariana Islands", "MP", "🇲🇵"],
    ["+47", "Norway", "NO", "🇳🇴"],
    ["+968", "Oman", "OM", "🇴🇲"],
    ["+92", "Pakistan", "PK", "🇵🇰"],
    ["+680", "Palau", "PW", "🇵🇼"],
    ["+970", "Palestinian Territories", "PS", "🇵🇸"],
    ["+507", "Panama", "PA", "🇵🇦"],
    ["+675", "Papua New Guinea", "PG", "🇵🇬"],
    ["+595", "Paraguay", "PY", "🇵🇾"],
    ["+51", "Peru", "PE", "🇵🇪"],
    ["+63", "Philippines", "PH", "🇵🇭"],
    ["+64", "Pitcairn Islands", "PN", "🇵🇳"],
    ["+48", "Poland", "PL", "🇵🇱"],
    ["+351", "Portugal", "PT", "🇵🇹"],
    ["+1 787", "Puerto Rico", "PR", "🇵🇷"],
    ["+1 939", "Puerto Rico", "PR", "🇵🇷"],
    ["+974", "Qatar", "QA", "🇶🇦"],
    ["+262", "Réunion", "RE", "🇷🇪"],
    ["+40", "Romania", "RO", "🇷🇴"],
    ["+7", "Russia", "RU", "🇷🇺"],
    ["+250", "Rwanda", "RW", "🇷🇼"],
    ["+590", "St. Barthélemy", "BL", "🇧🇱"],
    ["+290", "St. Helena", "SH", "🇸🇭"],
    ["+1 869", "St. Kitts & Nevis", "KN", "🇰🇳"],
    ["+1 758", "St. Lucia", "LC", "🇱🇨"],
    ["+590", "St. Martin (France)", "MF", "🇲🇫"],
    ["+508", "St. Pierre and Miquelon", "PM", "🇵🇲"],
    ["+1 784", "St. Vincent and the Grenadines", "VC", "🇻🇨"],
    ["+685", "Samoa", "WS", "🇼🇸"],
    ["+378", "San Marino", "SM", "🇸🇲"],
    ["+239", "São Tomé & Príncipe", "ST", "🇸🇹"],
    ["+966", "Saudi Arabia", "SA", "🇸🇦"],
    ["+221", "Senegal", "SN", "🇸🇳"],
    ["+381", "Serbia", "RS", "🇷🇸"],
    ["+248", "Seychelles", "SC", "🇸🇨"],
    ["+232", "Sierra Leone", "SL", "🇸🇱"],
    ["+65", "Singapore", "SG", "🇸🇬"],
    ["+599 3", "Sint Eustatius", "BQ", "🇧🇶"],
    ["+1 721", "Sint Maarten", "SX", "🇸🇽"],
    ["+421", "Slovakia", "SK", "🇸🇰"],
    ["+386", "Slovenia", "SI", "🇸🇮"],
    ["+677", "Solomon Islands", "SB", "🇸🇧"],
    ["+252", "Somalia", "SO", "🇸🇴"],
    ["+27", "South Africa", "ZA", "🇿🇦"],
    ["+500", "South Georgia & South Sandwich Islands", "GS", "🇬🇸"],
    ["+211", "South Sudan", "SS", "🇸🇸"],
    ["+34", "Spain", "ES", "🇪🇸"],
    ["+94", "Sri Lanka", "LK", "🇱🇰"],
    ["+249", "Sudan", "SD", "🇸🇩"],
    ["+597", "Suriname", "SR", "🇸🇷"],
    ["+47 79", "Svalbard", "SJ", "🇸🇯"],
    ["+268", "Swaziland", "SZ", "🇸🇿"],
    ["+46", "Sweden", "SE", "🇸🇪"],
    ["+41", "Switzerland", "CH", "🇨🇭"],
    ["+963", "Syria", "SY", "🇸🇾"],
    ["+886", "Taiwan", "TW", "🇹🇼"],
    ["+992", "Tajikistan", "TJ", "🇹🇯"],
    ["+255", "Tanzania", "TZ", "🇹🇿"],
    ["+66", "Thailand", "TH", "🇹🇭"],
    ["+228", "Togo", "TG", "🇹🇬"],
    ["+690", "Tokelau", "TK", "🇹🇰"],
    ["+676", "Tonga", "TO", "🇹🇴"],
    ["+1 868", "Trinidad & Tobago", "TT", "🇹🇹"],
    ["+216", "Tunisia", "TN", "🇹🇳"],
    ["+90", "Turkey", "TR", "🇹🇷"],
    ["+993", "Turkmenistan", "TM", "🇹🇲"],
    ["+1 649", "Turks & Caicos Islands", "TC", "🇹🇨"],
    ["+688", "Tuvalu", "TV", "🇹🇻"],
    ["+256", "Uganda", "UG", "🇺🇬"],
    ["+380", "Ukraine", "UA", "🇺🇦"],
    ["+971", "United Arab Emirates", "AE", "🇦🇪"],
    ["+44", "United Kingdom", "GB", "🇬🇧"],
    ["+1", "United States", "US", "🇺🇸"],
    ["+598", "Uruguay", "UY", "🇺🇾"],
    ["+1 340", "U.S. Virgin Islands", "VI", "🇻🇮"],
    ["+998", "Uzbekistan", "UZ", "🇺🇿"],
    ["+678", "Vanuatu", "VU", "🇻🇺"],
    ["+58", "Venezuela", "VE", "🇻🇪"],
    ["+379", "Vatican City", "VA", "🇻🇦"],
    ["+84", "Vietnam", "VN", "🇻🇳"],
    ["+681", "Wallis & Futuna", "WF", "🇼🇫"],
    ["+967", "Yemen", "YE", "🇾🇪"],
    ["+260", "Zambia", "ZM", "🇿🇲"],
    ["+255", "Zanzibar", "TZ", "🇹🇿"],
    ["+263", "Zimbabwe", "ZW", "🇿🇼"]
]