content = open('src/app/page.jsx', encoding='utf-8').read()

# Count occurrences
count = content.count('<RosterTeaser />')
print('RosterTeaser count:', count)

# Remove the first occurrence (the wrong one) including its wrapper section
bad = '''      {/* Firm Roster Teaser */}
      <section style={{ padding: "0 48px 80px", maxWidth: 1200, margin: "0 auto" }}>
        <FadeSection>
          <RosterTeaser />
        </FadeSection>
      </section>

      {/* Firm Roster Teaser */}'''

good = '''      {/* Firm Roster Teaser */}'''

fixed = content.replace(bad, good)
print('Fixed:', '<RosterTeaser />' in fixed)
print('Count after:', fixed.count('<RosterTeaser />'))
open('src/app/page.jsx', 'w', encoding='utf-8').write(fixed)
print('done')
