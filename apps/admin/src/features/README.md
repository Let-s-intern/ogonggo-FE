# features

One user action with business value (register a selector, approve a posting). A feature may import
from `entities/` and `shared/`, never from `widgets/`, `pages/` or `app/`, and never from another
feature — two features that need each other belong one layer up, in a widget.
