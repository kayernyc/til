# Property Wrappers in Swift

One of the things I love about looking at Swift is the way the language can evolve _because_ of its niche use case and the way it was designed.

Property wrappers allow the engineer to inject a tiny bit of variable handling into larger objects. It's not magic but it is great developer experience.

```swift

import Foundation

@propertyWrapper
struct Lowercased<String> {
  private var value: String

  var wrappedValue: String {
    get {
      value
    }

    set {
      value = newValue.lowercased()
    }
  }

  init(initialValue value: String) {
    self.value = value
  }

}


struct AnExample {
  @Lowercased var "JFK": String
}

```

It's a trivial example but there's always better opportunities to hide complexity:

[NSHipster Example](https://nshipster.com/propertywrapper/)

[Swift Lee](https://www.avanderlee.com/swift/property-wrappers/)
