content = open('src/app/page.jsx', encoding='utf-8').read()

# Insert RosterTeaser section after the features section (at position 25486)
insert_point = 25486
roster_section = '''      {/* Firm Roster Teaser */}
      <section style={{ padding: "0 48px 80px", maxWidth: 1200, margin: "0 auto" }}>
        <FadeSection>
          <RosterTeaser />
        </FadeSection>
      </section>

'''

new_content = content[:insert_point] + roster_section + content[insert_point:]
print('RosterTeaser section inserted')
print('Verify:', 'RosterTeaser />' in new_content)
open('src/app/page.jsx', 'w', encoding='utf-8').write(new_content)
print('done')
