import { useEffect, useRef, useState } from 'react';
import { APIProvider, useMapsLibrary, Map, useMap } from '@vis.gl/react-google-maps';
import {
  Alert,
  Autocomplete as MuiAutocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  SelectChangeEvent,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import axios from 'axios';
import { getTrackerHost, getTrackerServerGoHost, MQTT_WS_URL, getTrackerAnalyticsHost } from '../../utils/server';
import { useSimulationMqtt, SimulationNotification } from '../../hooks/useSimulationMqtt';

const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? '';
const SIMULATION_REQUEST_URL = `${getTrackerHost()}/simulations/request`;
const NEXT_GEN_SIMULATION_REQUEST_URL = `${getTrackerServerGoHost()}/simulations/request`;

const PROTOCOLS = ['WEBSOCKET', 'SSE', 'MQTT', 'GRPC', 'SHORT_POLLING', 'LONG_POLLING'] as const;
const NEXT_GEN_PROTOCOLS = ['QUIC', 'WEB_TRANSPORT', 'GRPC_QUIC', 'MQTT_QUIC'] as const;

const STEPS = ['Addresses', 'Configuration', 'Protocols'];

// ── Helpers ───────────────────────────────────────────────────────────────────

interface PlacesAutocompleteProps {
  label: string;
  onSelect: (place: google.maps.places.Place | null) => void;
}

function PlacesAutocomplete({ label, onSelect }: PlacesAutocompleteProps) {
  const placesLib = useMapsLibrary('places');
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);

  useEffect(() => {
    if (!placesLib || !inputValue.trim()) {
      setOptions([]);
      return;
    }
    if (!sessionToken.current) {
      sessionToken.current = new google.maps.places.AutocompleteSessionToken();
    }
    let active = true;
    const timer = setTimeout(() => {
      google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: inputValue,
        sessionToken: sessionToken.current!,
      })
        .then(({ suggestions }) => { if (active) setOptions(suggestions); })
        .catch(() => { if (active) setOptions([]); });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [inputValue, placesLib]);

  const handleSelect = async (
    suggestion: google.maps.places.AutocompleteSuggestion | null,
  ) => {
    if (!suggestion?.placePrediction) { onSelect(null); return; }
    const place = suggestion.placePrediction.toPlace();
    await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] });
    sessionToken.current = null;
    onSelect(place);
  };

  return (
    <MuiAutocomplete
      options={options}
      getOptionLabel={(s) => s.placePrediction?.text.text ?? ''}
      isOptionEqualToValue={(a, b) =>
        a.placePrediction?.placeId === b.placePrediction?.placeId
      }
      filterOptions={(x) => x}
      inputValue={inputValue}
      onInputChange={(_, value) => setInputValue(value)}
      onChange={(_, value) =>
        handleSelect(value as google.maps.places.AutocompleteSuggestion | null)
      }
      noOptionsText={inputValue ? 'No places found' : 'Start typing an address'}
      renderInput={(params) => (
        <TextField {...params} label={label} variant="outlined" fullWidth />
      )}
    />
  );
}

interface CounterFieldProps {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
}

function CounterField({ label, value, max, onChange }: CounterFieldProps) {
  return (
    <TextField
      label={label}
      type="number"
      value={value}
      onChange={(e) => {
        const n = parseInt(e.target.value, 10);
        if (!isNaN(n)) onChange(Math.min(max, Math.max(0, n)));
      }}
      inputProps={{ min: 0, max }}
      variant="outlined"
      fullWidth
    />
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────────

interface FormState {
  startPlace: google.maps.places.Place | null;
  destPlace: google.maps.places.Place | null;
  serverUpdateRatio: number;
  clientUpdateRatio: number;
  exchangeRatePerMin: number;
  numberOfUsers: number;
  protocols: Record<string, boolean>;
  isStreaming: boolean;
  numberOfClientDataPoints: number;
  numberOfServerDataPoints: number;
  isNextGen: boolean;
}

function StepAddresses({
  setForm,
}: {
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PlacesAutocomplete
        label="Start address"
        onSelect={(p) => setForm((f) => ({ ...f, startPlace: p }))}
      />
      <PlacesAutocomplete
        label="Destination"
        onSelect={(p) => setForm((f) => ({ ...f, destPlace: p }))}
      />
    </Box>
  );
}

function StepConfiguration({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const handleStreamingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isStreaming = e.target.checked;
    setForm((f) => ({
      ...f,
      isStreaming,
      ...(isStreaming
        ? { serverUpdateRatio: 0, clientUpdateRatio: 0, exchangeRatePerMin: 0 }
        : { numberOfClientDataPoints: 0, numberOfServerDataPoints: 0 }),
    }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <FormControlLabel
          control={<Checkbox checked={form.isStreaming} onChange={handleStreamingChange} />}
          label="Streaming"
        />
        <FormControlLabel
          control={<Checkbox checked={form.isNextGen} onChange={(e) => setForm(f => ({ ...f, isNextGen: e.target.checked }))} />}
          label="Next Gen Protocols"
        />
      </Box>

      {!form.isStreaming && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CounterField
              label="ServerUpdateRatio"
              value={form.serverUpdateRatio}
              max={100}
              onChange={(v) => setForm((f) => ({ ...f, serverUpdateRatio: v }))}
            />
            <Typography sx={{ flexShrink: 0 }}>:</Typography>
            <CounterField
              label="ClientUpdateRatio"
              value={form.clientUpdateRatio}
              max={100}
              onChange={(v) => setForm((f) => ({ ...f, clientUpdateRatio: v }))}
            />
          </Box>
          <CounterField
            label="ExchangeRatePerMin"
            value={form.exchangeRatePerMin}
            max={15000}
            onChange={(v) => setForm((f) => ({ ...f, exchangeRatePerMin: v }))}
          />
          <CounterField
            label="NumberOfClientDataPoints"
            value={form.numberOfClientDataPoints}
            max={2000}
            onChange={(v) => setForm((f) => ({ ...f, numberOfClientDataPoints: v }))}
          />
          <CounterField
            label="NumberOfServerDataPoints"
            value={form.numberOfServerDataPoints}
            max={2000}
            onChange={(v) => setForm((f) => ({ ...f, numberOfServerDataPoints: v }))}
          />
        </>
      )}

      {form.isStreaming && (
        <>
          <CounterField
            label="NumberOfClientDataPoints"
            value={form.numberOfClientDataPoints}
            max={2000}
            onChange={(v) => setForm((f) => ({ ...f, numberOfClientDataPoints: v }))}
          />
          <CounterField
            label="NumberOfServerDataPoints"
            value={form.numberOfServerDataPoints}
            max={2000}
            onChange={(v) => setForm((f) => ({ ...f, numberOfServerDataPoints: v }))}
          />
        </>
      )}

      <CounterField
        label="Number of Users"
        value={form.numberOfUsers}
        max={200}
        onChange={(v) => setForm((f) => ({ ...f, numberOfUsers: v }))}
      />
    </Box>
  );
}

function StepProtocols({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const toggle = (p: string) =>
    setForm((f) => ({ ...f, protocols: { ...f.protocols, [p]: !f.protocols[p] } }));

  const activeProtocols = form.isNextGen ? NEXT_GEN_PROTOCOLS : PROTOCOLS;

  return (
    <FormControl component="fieldset">
      <FormLabel component="legend">Select the protocols:</FormLabel>
      <FormGroup row>
        {activeProtocols.map((p) => (
          <FormControlLabel
            key={p}
            label={p}
            control={<Checkbox checked={!!form.protocols[p]} onChange={() => toggle(p)} />}
          />
        ))}
      </FormGroup>
    </FormControl>
  );
}

// ── Queue status ───────────────────────────────────────────────────────────────

interface QueueResponse {
  simulationId: string;
  position: number;
  estimatedWaitTime: string;
}

function SimulationProgressDisplay({ notification }: { notification: SimulationNotification }) {
  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flexGrow: 1 }}>
          <LinearProgress variant="determinate" value={notification.progress} sx={{ height: 10, borderRadius: 5 }} />
        </Box>
        <Typography variant="body2" color="text.secondary">{notification.progress}%</Typography>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {notification.protocolStatuses.map((ps) => (
          <Box key={ps.protocol} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {ps.status === 'completed' && <CheckCircleIcon color="success" fontSize="small" />}
            {ps.status === 'ongoing' && (
              <Box sx={{ display: 'flex', position: 'relative' }}>
                <CircularProgress size={16} />
              </Box>
            )}
            {ps.status === 'pending' && <PendingIcon color="disabled" fontSize="small" />}
            <Typography variant="caption">{ps.protocol}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function Path({ points }: { points: google.maps.LatLngLiteral[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    const polyline = new google.maps.Polyline({
      path: points,
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 4,
    });

    polyline.setMap(map);

    // Fit map bounds to path
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds);

    return () => {
      polyline.setMap(null);
    };
  }, [map, points]);

  return null;
}

function SimulationDetailsModal({
  open,
  onClose,
  simulationId,
  protocols,
  users,
}: {
  open: boolean;
  onClose: () => void;
  simulationId: string;
  protocols: string[];
  users: string[];
}) {
  const [selectedProtocol, setSelectedProtocol] = useState(protocols[0] ?? '');
  const [selectedUser, setSelectedUser] = useState(users[0] ?? '');
  const [locations, setLocations] = useState<google.maps.LatLngLiteral[]>([]);

  useEffect(() => {
    if (open && simulationId && selectedProtocol && selectedUser) {
      const url = `${getTrackerAnalyticsHost()}/simulation/${simulationId}/protocol/${selectedProtocol}/user/${selectedUser}`;
      console.log(`Fetching simulation details: ${url}`);
      axios
        .get(url)
        .then((res) => {
          console.log('Simulation Details Response:', res.data);
          const points = res.data.locations || [];
          setLocations(points);
        })
        .catch((err) => {
          console.error('Error fetching simulation details:', err);
          setLocations([]);
        });
    } else if (!open) {
      setLocations([]);
    }
  }, [open, simulationId, selectedProtocol, selectedUser]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Simulation Details</DialogTitle>
      <DialogContent sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="protocol-select-label">Protocol</InputLabel>
            <Select
              labelId="protocol-select-label"
              value={selectedProtocol}
              label="Protocol"
              onChange={(e: SelectChangeEvent) => setSelectedProtocol(e.target.value)}
            >
              {protocols.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="user-select-label">User</InputLabel>
            <Select
              labelId="user-select-label"
              value={selectedUser}
              label="User"
              onChange={(e: SelectChangeEvent) => setSelectedUser(e.target.value)}
            >
              {users.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ width: '100%', height: 400, borderRadius: 1, overflow: 'hidden', border: '1px solid #ddd' }}>
          <Map
            defaultCenter={{ lat: 0, lng: 0 }}
            defaultZoom={2}
            gestureHandling={'greedy'}
            disableDefaultUI={false}
          >
            <Path points={locations} />
          </Map>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">
            Displaying {locations.length} data points on the map.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function QueueStatus({
  queue,
  notification,
  onViewDetails,
}: {
  queue: QueueResponse;
  notification: SimulationNotification | null;
  onViewDetails: () => void;
}) {
  const status = notification?.status ?? 'QUEUED';

  return (
    <Card variant="outlined">
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {status === 'IN_PROGRESS' && (
          <Alert severity="success">
            Your simulation is starting! Simulation ID: <strong>{queue.simulationId}</strong>
          </Alert>
        )}
        {status === 'QUEUED' && (
          <>
            <Alert severity="info">
              You are in the queue. Position: <strong>{queue.position}</strong> — Estimated wait:{' '}
              <strong>{queue.estimatedWaitTime}</strong>
            </Alert>
            <Typography variant="caption" color="text.secondary">
              Simulation ID: {queue.simulationId} — Waiting for MQTT notification…
            </Typography>
          </>
        )}
        {status === 'COMPLETED' && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Alert severity="success" sx={{ flexGrow: 1 }}>
              All protocol simulations have been completed. Simulation ID: <strong>{queue.simulationId}</strong>
            </Alert>
            <Button variant="outlined" size="small" onClick={onViewDetails} sx={{ height: 'fit-content' }}>
              View Details
            </Button>
          </Box>
        )}
        {notification && <SimulationProgressDisplay notification={notification} />}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const INITIAL_FORM: FormState = {
  startPlace: null,
  destPlace: null,
  serverUpdateRatio: 0,
  clientUpdateRatio: 0,
  exchangeRatePerMin: 0,
  numberOfUsers: 0,
  protocols: { WEBSOCKET: false, SSE: false, MQTT: false, GRPC: false, SHORT_POLLING: false, LONG_POLLING: false, QUIC: false, WEB_TRANSPORT: false, GRPC_OVER_QUIC: false, MQTT_OVER_QUIC: false },
  isStreaming: false,
  numberOfClientDataPoints: 0,
  numberOfServerDataPoints: 0,
  isNextGen: false,
};

function generateClientId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments where crypto.randomUUID is not available (e.g., non-HTTPS)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function RouteContent() {
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [queueResponse, setQueueResponse] = useState<QueueResponse | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const mqttNotification = useSimulationMqtt(clientId, MQTT_WS_URL);
  const simulationReady = mqttNotification?.status === 'IN_PROGRESS';

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    setQueueResponse(null);

    const newClientId = generateClientId();
    setClientId(newClientId);

    try {
      const userIds = Array.from({ length: form.numberOfUsers }, (_, i) => `user${i + 1}`);
      const activeProtocolsList: readonly string[] = form.isNextGen ? NEXT_GEN_PROTOCOLS : PROTOCOLS;
      const selectedProtocols = activeProtocolsList.filter((p) => form.protocols[p]);
      const targetUrl = form.isNextGen ? NEXT_GEN_SIMULATION_REQUEST_URL : SIMULATION_REQUEST_URL;

      const { data } = await axios.post<QueueResponse>(targetUrl, {
        clientId: newClientId,
        protocols: selectedProtocols,
        startAddress: form.startPlace?.formattedAddress ?? '',
        destination: form.destPlace?.formattedAddress ?? '',
        userIds,
        serverUpdateRatio: form.serverUpdateRatio,
        clientUpdateRatio: form.clientUpdateRatio,
        exchangeRatePerMin: form.exchangeRatePerMin,
        isStreaming: form.isStreaming,
        numberOfClientDataPoints: form.numberOfClientDataPoints,
        numberOfServerDataPoints: form.numberOfServerDataPoints,
      });

      setQueueResponse(data);
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setActiveStep(0);
    setQueueResponse(null);
    setClientId(null);
    setSubmitError(null);
  };

  const isLastStep = activeStep === STEPS.length - 1;

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 640 }}>
      <Typography variant="h6">Route</Typography>

      {queueResponse ? (
        <>
          <QueueStatus
            queue={queueResponse}
            notification={mqttNotification}
            onViewDetails={() => setIsDetailsOpen(true)}
          />
          <Button onClick={handleReset}>New Simulation</Button>

          <SimulationDetailsModal
            open={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            simulationId={queueResponse.simulationId}
            protocols={Object.keys(form.protocols).filter((p) => form.protocols[p])}
            users={Array.from({ length: form.numberOfUsers }, (_, i) => `user${i + 1}`)}
          />
        </>
      ) : (
        <>
          <Stepper activeStep={activeStep}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box>
            {activeStep === 0 && <StepAddresses setForm={setForm} />}
            {activeStep === 1 && <StepConfiguration form={form} setForm={setForm} />}
            {activeStep === 2 && <StepProtocols form={form} setForm={setForm} />}
          </Box>

          {submitError && (
            <Alert severity="error">{submitError}</Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={() => setActiveStep((s) => s - 1)}
            >
              Back
            </Button>
            {isLastStep ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : 'Request Simulation'}
              </Button>
            ) : (
              <Button variant="contained" onClick={() => setActiveStep((s) => s + 1)}>
                Next
              </Button>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}

export function Route() {
  return (
    <APIProvider apiKey={API_KEY}>
      <RouteContent />
    </APIProvider>
  );
}
