import { useFolders } from "../context/FolderContext";

function Test() {
  const { folders } = useFolders();
  return (
    <div>Test Tab</div>
  );
};

export default Test;