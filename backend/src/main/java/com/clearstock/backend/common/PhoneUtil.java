package com.clearstock.backend.common;

/**
 * One canonical shape for every Ghanaian number we store or look up: the local
 * form, "0XXXXXXXXX".
 *
 * People type the same number several ways — with the country code, without it,
 * with spaces, with or without the leading zero (our sign-up screen shows a
 * "+233" prefix, so numbers get typed nine digits long there and ten digits on
 * the login screen). Stored raw, those are different strings, and an account
 * created one way can't be found the other way. Everything that reaches the
 * database goes through here first.
 */
public final class PhoneUtil {

    private PhoneUtil() {
    }

    public static String normalize(String phone) {
        if (phone == null) {
            return null;
        }

        String digits = phone.replaceAll("\\D", "");
        if (digits.isEmpty()) {
            return phone.strip();
        }

        // "+233 59 682 9238" / "233596829238" -> "596829238"
        if (digits.startsWith("233") && digits.length() > 9) {
            digits = digits.substring(3);
        }
        // Nine digits mean the leading zero was dropped along with the prefix.
        if (digits.length() == 9) {
            digits = "0" + digits;
        }
        return digits;
    }
}
