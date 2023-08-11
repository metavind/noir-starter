fn main(x : Field, y : Field) -> pub Field {
  x + y
}

////////////////////
//     TESTS      //
////////////////////
#[test]
fn test_add() {
  assert(main(0, 0) == 0);
  assert(main(1, 2) == 3);
}
