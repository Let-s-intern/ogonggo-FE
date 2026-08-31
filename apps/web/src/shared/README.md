# shared

Code with no business meaning: API client wiring, generic hooks, route paths, env config. Imports
nothing from another layer in this app. `@ogonggo/ui` and `@ogonggo/api` cover the cross-app shared
surface — this layer is for what is specific to this one app.
