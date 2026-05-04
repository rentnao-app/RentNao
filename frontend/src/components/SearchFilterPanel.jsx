import PropertySearchBar from './PropertySearchBar';

/** @deprecated Use PropertySearchBar; kept for imports that expect this name. */
export default function SearchFilterPanel(props) {
  return <PropertySearchBar {...props} showSort={props.showSort ?? true} />;
}
