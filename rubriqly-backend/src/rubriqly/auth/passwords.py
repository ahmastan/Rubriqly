"""Password hashing (Argon2) and the rules for new passwords (docs/architecture.md, "Accounts")."""

import secrets

from pwdlib import PasswordHash

MIN_LENGTH = 12
MAX_LENGTH = 128

_hasher = PasswordHash.recommended()
# Checked against when the email doesn't exist, so a wrong email takes as long as a wrong password.
_DUMMY_HASH = _hasher.hash(secrets.token_urlsafe(16))

# Long but very common passwords. Short ones are already refused by MIN_LENGTH.
_COMMON = frozenset(
    {
        "password1234",
        "password12345",
        "password123456",
        "passwordpassword",
        "iloveyou1234",
        "qwertyuiopasdfgh",
        "qwerty123456",
        "1q2w3e4r5t6y",
        "1qaz2wsx3edc",
        "letmein12345",
        "welcome12345",
        "administrator",
        "changeme1234",
        "rubriqly1234",
        "rubriqlyrubriqly",
    }
)
_SEQUENCES = ("0123456789012345678901234567890", "abcdefghijklmnopqrstuvwxyz", "qwertyuiop")

# Easy to read and type: no 0/O, 1/l/I.
_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> tuple[bool, str | None]:
    """Returns (matches, new hash if the stored one uses outdated settings)."""
    return _hasher.verify_and_update(password, password_hash)


def burn_equal_time(password: str) -> None:
    _hasher.verify(password, _DUMMY_HASH)


def password_problem(password: str, email: str = "") -> str | None:
    """A message for the user if the password isn't allowed, otherwise None."""
    if len(password) < MIN_LENGTH:
        return f"Use at least {MIN_LENGTH} characters."
    if len(password) > MAX_LENGTH:
        return f"Use at most {MAX_LENGTH} characters."
    lowered = password.lower()
    if lowered in _COMMON or len(set(lowered)) <= 2:
        return "This password is too common. Try a few random words together."
    if any(lowered in sequence for sequence in _SEQUENCES):
        return "This password is too easy to guess. Try a few random words together."
    name = email.split("@")[0].lower()
    if len(name) >= 4 and name in lowered:
        return "Don't include your email address in your password."
    return None


def generate_password() -> str:
    """A strong password for accounts created by an admin, e.g. `k7Qp-mR2x-Wd9v-Lf4n`."""
    groups = ("".join(secrets.choice(_ALPHABET) for _ in range(4)) for _ in range(4))
    return "-".join(groups)
