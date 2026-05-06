/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import CSVEditor from './components/CSVEditor';

export default function App() {
  return (
    <div className="antialiased min-h-screen bg-gray-50 font-sans selection:bg-teal-100 selection:text-teal-900">
      <CSVEditor />
    </div>
  );
}
