# Rabbit documentation rules

## New catalogue items

Every newly created catalogue item must include a linked detail page with:

- Full English and Korean versions. The Korean section must be a complete parallel version of the English content, not a shortened summary.
- Visible language navigation between the English (`#en`) and Korean (`#ko`) sections.
- Separate `Copy English` and `Copy 한국어` buttons that copy the complete corresponding version, including its title.
- Clipboard fallback behavior so copying still works when the documentation is opened locally and the Clipboard API is unavailable.

Before handing off a new item, verify that its catalogue anchor, detail-page link, language sections, copy controls, and referenced copy targets all resolve correctly.
