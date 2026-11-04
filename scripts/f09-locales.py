import json
import re
import glob

fr_path = 'src/assets/locales/fr.json'
en_path = 'src/assets/locales/en.json'

en_values = {
    'account_active': 'Active',
    'account_expired': 'Invitation expired',
    'account_invited': 'Invited',
    'account_none': 'No account',
    'add_lead': 'One flow: search a profile, attach it, or create and invite.',
    'add_title': 'Add a participant',
    'avatar_pending': '{name} was created without a photo: the upload failed.',
    'avatar_retry': 'Retry the photo upload',
    'col_account': 'Account',
    'col_action': 'Action',
    'col_editions': 'Editions',
    'col_nickname': 'Nickname',
    'col_player': 'Player',
    'create_hint': 'None of these profiles? Create it and send the invitation',
    'create_title': 'Create a new participant "{query}"',
    'error_already_registered': 'This player is already registered for this edition.',
    'error_avatar_too_large': 'The photo is larger than 2 MB.',
    'error_avatar_type': 'The photo must be a JPEG, PNG or WebP image.',
    'error_avatar_unreadable': 'The photo is unreadable: choose another image.',
    'error_competitor_not_found': 'This profile no longer exists.',
    'error_edition_closed': 'This edition is closed: it is read-only.',
    'error_email_used': 'This email is already linked to another account. Attach the existing profile or correct the email.',
    'error_forbidden': 'This action is reserved for administrators.',
    'error_offline': 'Offline: check your connection and try again.',
    'error_rate_limited': 'Too many requests: wait a moment and try again.',
    'error_registration_closed': 'Registration is closed: the pools draw is validated.',
    'error_timeout': 'The upload took too long: try again.',
    'error_unauthorized': 'Your session has expired: sign in again.',
    'error_unknown': 'Something went wrong: try again.',
    'error_validation': 'Some information is invalid or too long: correct it and try again.',
    'existing_profile': 'Existing profile',
    'eyebrow_none': 'No edition',
    'feedback_attached': 'Profile attached to the {year} edition',
    'feedback_avatar_failed': '{name} was created, but the photo was not uploaded: {reason}',
    'feedback_avatar_sent': 'Photo uploaded',
    'feedback_invitation_failed': 'Participant created, but the invitation could not be sent: resend it from the list.',
    'feedback_invitation_sent': 'Invitation sent',
    'feedback_removed': 'Participant removed from the edition',
    'feedback_resend_failed': 'The invitation could not be sent: try again.',
    'feedback_resent': 'Invitation resent: the previous link is cancelled',
    'field_avatar': 'Avatar',
    'field_avatar_hint': 'JPEG, PNG or WebP, 2 MB at most. Optional.',
    'field_email': 'Email · private',
    'field_first_name': 'First name',
    'field_last_name': 'Last name',
    'field_nickname': 'Nickname',
    'field_phone': 'Phone · private',
    'form_cancel': 'Cancel',
    'form_submit': 'Create, attach and invite',
    'form_title': 'New participant',
    'invitation_text': 'An account is created and an invitation email is sent right away. The link is valid for 7 days; resending cancels the previous one.',
    'invitation_title': 'Invitation',
    'list_caption': 'Participants registered for the active edition',
    'list_empty': 'No participant registered yet.',
    'list_error': 'The list of participants could not be loaded.',
    'list_title': 'Registered',
    'nickname': '"{nickname}"',
    'read_only': 'This edition is closed: participants can no longer change.',
    'remove': 'Remove',
    'remove_for': 'Remove {name}',
    'resend': 'Resend',
    'resend_for': 'Resend the invitation to {name}',
    'rule_email': 'Invalid email address',
    'rule_phone': 'Invalid phone number',
    'rule_required': 'Required field',
    'rule_too_long': 'Too long',
    'search_close': 'Close the list of profiles',
    'search_label': 'Name, first name or nickname',
    'search_no_data': 'No profile matches.',
    'search_open': 'Open the list of profiles',
    'suggestion_one': '1 edition',
    'suggestion_other': '{count} editions',
    'summary_one': '1 registered',
    'summary_other': '{count} registered',
    'summary_read_only': 'closed edition, read-only',
    'summary_rule': 'adding and removing allowed until the draw is validated',
}

files = glob.glob('src/components/admin/participants/*.vue') + [
    'src/pages/admin/participants.vue',
    'src/composables/useAdminParticipants.ts',
    'src/consts/admin-participants.const.ts',
    'src/utils/admin-participants.util.ts',
]
found = {}
pattern = re.compile(r"""(?:t\(\s*|key:\s*)'(admin\.participants\.[a-z0-9_]+)'\s*,\s*(?:fallback:\s*)?'((?:[^'\\]|\\.)*)'""")
for f in files:
    for m in pattern.finditer(open(f).read()):
        found.setdefault(m.group(1), m.group(2).replace("\\'", "'"))

missing_en = [k for k in found if k.split('.', 2)[2] not in en_values]
assert not missing_en, missing_en

def insert(path, values):
    text = open(path).read()
    data = json.loads(text)
    for key, value in values.items():
        if key in data:
            continue
        data[key] = value
    return data

for path, build in ((fr_path, lambda k: found[k]), (en_path, lambda k: en_values[k.split('.', 2)[2]])):
    text = open(path).read()
    lines = text.rstrip('\n').split('\n')
    keys = sorted(found)
    new_lines = [f'  {json.dumps(k)}: {json.dumps(build(k), ensure_ascii=False)},' for k in keys if f'"{k}"' not in text]
    anchor = next(i for i, line in enumerate(lines) if line.startswith('  "pages.'))
    lines[anchor:anchor] = new_lines
    open(path, 'w').write('\n'.join(lines) + '\n')
    json.loads(open(path).read())
print(len(found), 'clés')
